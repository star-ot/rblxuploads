"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { AssetLibraryManager } from "@/components/AssetLibraryManager";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Uploader } from "@/components/Uploader";
import { UploadQueue } from "@/components/UploadQueue";
import { ResultsTable } from "@/components/ResultsTable";
import { useToast } from "@/components/ui/Toast";
import {
  KeyboardShortcutsModal,
  useWorkspaceShortcuts,
} from "@/components/workspace/KeyboardShortcutsModal";
import { WorkspaceOnboarding } from "@/components/workspace/WorkspaceOnboarding";
import { VaultUnlockModal } from "@/components/VaultUnlockModal";
import { useCredentialVaultLock } from "@/hooks/useCredentialVaultLock";
import { usePersistedConfig } from "@/hooks/usePersistedConfig";
import {
  getAssetType,
  getUnsupportedReason,
  isSupportedAssetFile,
} from "@/lib/file-parser";
import { formatRobloxAssetName } from "@/lib/name-formatter";
import { runQueue } from "@/lib/upload/queue";
import type { UploadQueueItem } from "@/lib/types";
import { isProfileReady, validateActiveProfile } from "@/lib/config/credentials";
import { listLocalAssets } from "@/lib/local-assets-db";
import { uploadAsset } from "@/lib/upload/client";
import {
  partitionPolicyViolations,
  validateFilePolicy,
} from "@/lib/policy/validate";
import { notifyBatchComplete } from "@/lib/webhook/client";

type WorkspaceView = "upload" | "library" | "settings";

export default function WorkspacePage() {
  const {
    config,
    setConfig,
    vaultLocked,
    vaultLoading,
    lockVault,
    unlockVault,
  } = usePersistedConfig();
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [activeView, setActiveView] = useState<WorkspaceView>("upload");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [libraryAssetCount, setLibraryAssetCount] = useState(0);
  const itemsRef = useRef(items);
  const { pushToast } = useToast();

  useCredentialVaultLock({
    config,
    vaultLocked,
    lockVault,
  });

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    void listLocalAssets().then((assets) => setLibraryAssetCount(assets.length));
  }, [items]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  useWorkspaceShortcuts({
    onUpload: () => setActiveView("upload"),
    onLibrary: () => setActiveView("library"),
    onSettings: () => setActiveView("settings"),
    onHelp: () => setShortcutsOpen(true),
    enabled: !shortcutsOpen,
  });

  const hasCredentials = useMemo(
    () => config.profiles.some((profile) => isProfileReady(profile)),
    [config.profiles],
  );
  const hasUpload = items.some((item) => item.status === "complete");

  const summary = useMemo(() => {
    const total = items.length;
    const completeCount = items.filter((item) => item.status === "complete").length;
    const failedCount = items.filter((item) => item.status === "failed").length;
    const activeCount = items.filter(
      (item) => item.status === "uploading" || item.status === "processing",
    ).length;
    const doneCount = completeCount + failedCount;
    const progressPercent =
      total === 0 ? 0 : Math.round((doneCount / total) * 100);

    let etaLabel = "";
    if (isRunning && startedAt && doneCount > 0 && doneCount < total) {
      const elapsed = tick - startedAt;
      const avgPerItem = elapsed / doneCount;
      const remainingMs = avgPerItem * (total - doneCount);
      etaLabel = formatDuration(remainingMs);
    }

    return {
      total,
      completeCount,
      failedCount,
      activeCount,
      doneCount,
      progressPercent,
      etaLabel,
    };
  }, [isRunning, items, startedAt, tick]);

  function updateItem(id: string, updater: (item: UploadQueueItem) => UploadQueueItem) {
    setItems((current) =>
      current.map((item) => (item.id === id ? updater(item) : item)),
    );
  }

  function addFiles(files: File[]) {
    void enqueueFiles(files);
  }

  function queueVersionUpload(payload: {
    libraryAssetId: string;
    file: File;
    assetName: string;
  }) {
    const fileIsSupported = isSupportedAssetFile(payload.file);
    const item: UploadQueueItem = {
      id: crypto.randomUUID(),
      file: payload.file,
      fileName: payload.file.name,
      previewUrl: URL.createObjectURL(payload.file),
      assetType: getAssetType(payload.file) ?? "Image",
      assetName: payload.assetName,
      status: fileIsSupported ? "waiting" : "failed",
      progress: fileIsSupported ? 0 : 100,
      attempt: 0,
      error: fileIsSupported ? undefined : getUnsupportedReason(payload.file),
      createdAt: Date.now(),
      replaceLibraryAssetId: payload.libraryAssetId,
    };

    setItems((current) => [...current, item]);
    setActiveView("upload");
    pushToast(`Queued new version for "${payload.assetName}"`, "success");
  }

  async function enqueueFiles(files: File[]) {
    const existingNames = itemsRef.current.map((item) => item.assetName);
    const created: UploadQueueItem[] = [];
    let policyBlocked = 0;
    let policyWarned = 0;

    for (const file of files) {
      const fileIsSupported = isSupportedAssetFile(file);
      const unsupportedReason = getUnsupportedReason(file);
      const assetType = getAssetType(file) ?? "Image";
      const assetName = formatRobloxAssetName(file.name);

      let status: UploadQueueItem["status"] = fileIsSupported ? "waiting" : "failed";
      let progress = fileIsSupported ? 0 : 100;
      let error = fileIsSupported ? undefined : unsupportedReason;
      let policyWarnings: string[] | undefined;

      if (fileIsSupported && config.policy?.enabled) {
        const violations = await validateFilePolicy(file, {
          policy: config.policy,
          queueNames: [...existingNames, ...created.map((item) => item.assetName)],
        });
        const { errors, warnings } = partitionPolicyViolations(violations);

        if (warnings.length) {
          policyWarnings = warnings.map((v) => v.message);
          policyWarned += warnings.length;
        }

        if (errors.length && config.policy?.blockOnViolation) {
          status = "failed";
          progress = 100;
          error = errors.map((v) => v.message).join(" ");
          policyBlocked += 1;
        }
      }

      created.push({
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        assetType,
        assetName,
        status,
        progress,
        attempt: 0,
        error,
        policyWarnings,
        createdAt: Date.now(),
      });
    }

    setItems((current) => [...current, ...created]);
    if (created.length > 0) {
      const added = created.length - policyBlocked;
      if (policyBlocked > 0) {
        pushToast(
          `Added ${added} file${added === 1 ? "" : "s"} — ${policyBlocked} blocked by policy`,
          "error",
        );
      } else if (policyWarned > 0) {
        pushToast(
          `Added ${created.length} file${created.length === 1 ? "" : "s"} with policy warnings`,
          "info",
        );
      } else {
        pushToast(`Added ${created.length} file${created.length === 1 ? "" : "s"} to queue`, "info");
      }
    }
  }

  function removeItem(id: string) {
    setItems((current) => {
      const found = current.find((item) => item.id === id);
      if (found) {
        URL.revokeObjectURL(found.previewUrl);
      }

      return current.filter((item) => item.id !== id);
    });
  }

  function clearFinished() {
    setItems((current) => {
      const keep: UploadQueueItem[] = [];
      for (const item of current) {
        if (item.status === "complete" || item.status === "failed") {
          URL.revokeObjectURL(item.previewUrl);
          continue;
        }

        keep.push(item);
      }
      return keep;
    });
  }

  function retryFailed() {
    setItems((current) =>
      current.map((item) => {
        if (item.status !== "failed" || !isSupportedAssetFile(item.file)) {
          return item;
        }

        return {
          ...item,
          status: "waiting",
          progress: 0,
          error: undefined,
        };
      }),
    );
  }

  async function startUpload() {
    if (isRunning) {
      return;
    }

    const credentialError = vaultLocked
      ? "Unlock the credential vault in Settings before uploading."
      : validateActiveProfile(config);
    if (credentialError) {
      setStatusMessage(credentialError);
      pushToast(credentialError, "error");
      setActiveView("settings");
      return;
    }

    const targetIds = itemsRef.current
      .filter((item) => item.status === "waiting")
      .map((item) => item.id);

    if (targetIds.length === 0) {
      setStatusMessage("Nothing waiting in the queue.");
      return;
    }

    if (config.policy?.enabled && config.policy.blockOnViolation) {
      const waiting = itemsRef.current.filter((item) => item.status === "waiting");
      let blocked = false;
      for (const item of waiting) {
        const violations = await validateFilePolicy(item.file, {
          policy: config.policy,
          queueNames: waiting
            .filter((other) => other.id !== item.id)
            .map((other) => other.assetName),
        });
        const { errors } = partitionPolicyViolations(violations);
        if (errors.length) {
          updateItem(item.id, (current) => ({
            ...current,
            status: "failed",
            progress: 100,
            error: errors.map((v) => v.message).join(" "),
          }));
          blocked = true;
        }
      }
      if (blocked) {
        setStatusMessage("Policy violations blocked one or more files. Fix or remove them.");
        pushToast("Upload blocked — policy violations in queue", "error");
        return;
      }
    }

    setStatusMessage("");
    setStartedAt(Date.now());
    setTick(Date.now());
    setIsRunning(true);

    try {
      await runQueue({
        items: targetIds,
        concurrency: config.concurrency,
        worker: async (id) => {
          for (let attempt = 1; attempt <= config.maxRetries + 1; attempt += 1) {
            const snapshot = itemsRef.current.find((item) => item.id === id);
            if (!snapshot) {
              return;
            }

            updateItem(id, (item) => ({
              ...item,
              attempt,
              status: "uploading",
              progress: 20,
              error: undefined,
            }));

            try {
              const result = await uploadAsset({ item: snapshot, config });
              if (!result.ok || !result.assetId) {
                throw new Error(result.error ?? "Upload failed");
              }

              updateItem(id, (item) => ({
                ...item,
                status: "processing",
                progress: 90,
              }));

              await sleep(180);

              updateItem(id, (item) => ({
                ...item,
                status: "complete",
                progress: 100,
                assetId: result.assetId,
                error: undefined,
              }));
              return;
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Upload failed";
              const shouldRetry = attempt <= config.maxRetries;

              updateItem(id, (item) => ({
                ...item,
                status: shouldRetry ? "waiting" : "failed",
                progress: shouldRetry ? 0 : 100,
                error: shouldRetry
                  ? `Retrying (${attempt}/${config.maxRetries + 1}) — ${message}`
                  : message,
              }));

              if (!shouldRetry) {
                return;
              }
            }
          }
        },
      });
    } finally {
      setIsRunning(false);
      const snapshot = itemsRef.current;
      const done = snapshot.filter((i) => i.status === "complete").length;
      const failed = snapshot.filter((i) => i.status === "failed").length;
      const retried = snapshot.reduce((sum, item) => sum + Math.max(0, item.attempt - 1), 0);

      if (done > 0 || failed > 0) {
        pushToast(
          `Upload batch finished — ${done} succeeded${failed ? `, ${failed} failed` : ""}.`,
          failed ? "info" : "success",
        );

        if (config.webhook?.enabled) {
          const webhook = await notifyBatchComplete(config, {
            total: snapshot.length,
            succeeded: done,
            failed,
            retried,
            items: snapshot,
          });
          if (!webhook.ok && webhook.error) {
            pushToast(`Webhook: ${webhook.error}`, "error");
          }
        }
      }
    }
  }

  return (
    <>
      <VaultUnlockModal
        open={!vaultLoading && vaultLocked}
        onUnlock={unlockVault}
      />
      <WorkspaceShell
        activeView={activeView}
        onViewChange={setActiveView}
        statusMessage={statusMessage}
        queueCount={items.filter((i) => i.status === "waiting").length}
        config={config}
        onConfigChange={setConfig}
        configSwitcherDisabled={isRunning}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      >
        <WorkspaceOnboarding
          hasCredentials={hasCredentials}
          hasUpload={hasUpload}
          hasLibraryAssets={libraryAssetCount > 0}
          onGoSettings={() => setActiveView("settings")}
          onGoUpload={() => setActiveView("upload")}
          onGoLibrary={() => setActiveView("library")}
        />

        {activeView === "settings" ? (
          <SettingsPanel
            config={config}
            onChange={setConfig}
            disabled={isRunning}
            vaultLocked={vaultLocked}
            onLockVault={lockVault}
          />
        ) : null}

        {activeView === "upload" ? (
          <>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <Uploader disabled={isRunning} onFilesAdded={addFiles} />
              <UploadQueue
                items={items}
                isRunning={isRunning}
                progressPercent={summary.progressPercent}
                completedCount={summary.doneCount}
                etaLabel={summary.etaLabel}
                onStart={startUpload}
                onRetryFailed={retryFailed}
                onClearFinished={clearFinished}
                onNameChange={(id, name) => {
                  updateItem(id, (item) => ({
                    ...item,
                    assetName: formatRobloxAssetName(name),
                  }));
                }}
                onRemove={removeItem}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] px-4 py-3 font-mono text-xs">
              <span className="text-[var(--text-muted)]">
                Active{" "}
                <span className="text-[var(--accent)]">{summary.activeCount}</span>
              </span>
              <span className="text-[var(--text-muted)]">
                Done{" "}
                <span className="text-[var(--success-text)]">{summary.completeCount}</span>
              </span>
              <span className="text-[var(--text-muted)]">
                Failed{" "}
                <span className="text-[var(--danger-text)]">{summary.failedCount}</span>
              </span>
              <span className="text-[var(--text-muted)]">
                Total{" "}
                <span className="text-[var(--text-secondary)]">{summary.total}</span>
              </span>
            </div>

            <ResultsTable items={items} />
          </>
        ) : null}

        {activeView === "library" ? (
          <AssetLibraryManager
            items={items}
            config={config}
            onNotify={(message, tone) => pushToast(message, tone ?? "info")}
            onQueueVersionUpload={queueVersionUpload}
          />
        ) : null}
      </WorkspaceShell>

      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "";
  }

  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
