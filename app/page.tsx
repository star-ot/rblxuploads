"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { AssetLibraryManager } from "@/components/AssetLibraryManager";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Uploader } from "@/components/Uploader";
import { UploadQueue } from "@/components/UploadQueue";
import { ResultsTable } from "@/components/ResultsTable";
import { usePersistedConfig } from "@/hooks/usePersistedConfig";
import {
  getAssetType,
  getUnsupportedReason,
  isSupportedAssetFile,
} from "@/lib/file-parser";
import { formatRobloxAssetName } from "@/lib/name-formatter";
import { runQueue } from "@/lib/upload/queue";
import type { UploadQueueItem } from "@/lib/types";
import { uploadAsset } from "@/lib/upload/client";

export default function Home() {
  const [config, setConfig] = usePersistedConfig();
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
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
    const created = files.map((file) => {
      const fileIsSupported = isSupportedAssetFile(file);
      const unsupportedReason = getUnsupportedReason(file);
      const assetType = getAssetType(file) ?? "Image";

      return {
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        assetType,
        assetName: formatRobloxAssetName(file.name),
        status: fileIsSupported ? "waiting" : "failed",
        progress: fileIsSupported ? 0 : 100,
        attempt: 0,
        error: fileIsSupported ? undefined : unsupportedReason,
        createdAt: Date.now(),
      } satisfies UploadQueueItem;
    });

    setItems((current) => [...current, ...created]);
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

    if (!config.apiKey.trim()) {
      setStatusMessage("Add your Roblox Open Cloud API key under Credentials.");
      return;
    }

    if (!config.creatorId.trim() || !/^\d+$/.test(config.creatorId.trim())) {
      setStatusMessage("Creator ID must be a numeric Roblox user or group ID.");
      return;
    }

    const targetIds = itemsRef.current
      .filter((item) => item.status === "waiting")
      .map((item) => item.id);

    if (targetIds.length === 0) {
      setStatusMessage("Nothing waiting in the queue.");
      return;
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
    }
  }

  return (
    <div className="app-backdrop flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 md:px-8">
        <AppHeader statusMessage={statusMessage} />

        <SettingsPanel config={config} onChange={setConfig} disabled={isRunning} />

        <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
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

        <div className="panel flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-[var(--text-muted)]">
          <span>
            active <span className="text-[var(--accent)]">{summary.activeCount}</span>
          </span>
          <span>
            done <span className="text-[var(--success-text)]">{summary.completeCount}</span>
          </span>
          <span>
            failed <span className="text-[var(--danger-text)]">{summary.failedCount}</span>
          </span>
          <span>
            total <span className="text-[var(--text-secondary)]">{summary.total}</span>
          </span>
        </div>

        <ResultsTable items={items} />
        <AssetLibraryManager items={items} config={config} />
      </main>

      <AppFooter />
    </div>
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
