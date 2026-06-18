"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Uploader } from "@/components/Uploader";
import { UploadQueue } from "@/components/UploadQueue";
import { ResultsTable } from "@/components/ResultsTable";
import { getUnsupportedReason, isSupportedImageFile } from "@/lib/file-parser";
import { formatRobloxAssetName } from "@/lib/name-formatter";
import { runQueue } from "@/lib/queue-manager";
import type { UploadConfig, UploadQueueItem } from "@/lib/types";
import { uploadImageAsset } from "@/lib/upload-client";

const STORAGE_KEY = "roblox-asset-uploader-config-v1";

const DEFAULT_CONFIG: UploadConfig = {
  apiKey: "",
  creatorId: "",
  creatorType: "user",
  publicBlobReadWriteToken: "",
  concurrency: 4,
  maxRetries: 2,
};

export default function Home() {
  const [config, setConfig] = useState<UploadConfig>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_CONFIG;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return DEFAULT_CONFIG;
      }

      const saved = JSON.parse(raw) as Partial<UploadConfig>;
      return {
        ...DEFAULT_CONFIG,
        ...saved,
      };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_CONFIG;
    }
  });
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

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
      const fileIsSupported = isSupportedImageFile(file);
      const unsupportedReason = getUnsupportedReason(file);

      return {
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
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
        if (item.status !== "failed" || !isSupportedImageFile(item.file)) {
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
      setStatusMessage("Enter a Roblox Open Cloud API key in configuration.");
      return;
    }

    if (!config.creatorId.trim() || !/^\d+$/.test(config.creatorId.trim())) {
      setStatusMessage("Creator ID must be a numeric value.");
      return;
    }

    const targetIds = itemsRef.current
      .filter((item) => item.status === "waiting")
      .map((item) => item.id);

    if (targetIds.length === 0) {
      setStatusMessage("No waiting files in queue.");
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
              const result = await uploadImageAsset({ item: snapshot, config });
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
                  ? `Retrying (${attempt}/${config.maxRetries + 1}) - ${message}`
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Roblox Open Cloud Asset Uploader
          </h1>
          <p className="max-w-3xl text-sm text-zinc-400">
            Batch upload game icons and sprites as Roblox Image assets using a
            controlled queue with retry and live status tracking.
          </p>
          {statusMessage ? (
            <p className="rounded-md border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
              {statusMessage}
            </p>
          ) : null}
        </header>

        <SettingsPanel config={config} onChange={setConfig} disabled={isRunning} />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
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

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
          <span className="text-zinc-100">{summary.activeCount}</span> uploading now,
          {" "}
          <span className="text-zinc-100">{summary.completeCount}</span> completed,
          {" "}
          <span className="text-zinc-100">{summary.failedCount}</span> failed,
          {" "}
          <span className="text-zinc-100">{summary.total}</span> total.
        </div>

        <ResultsTable items={items} />
      </main>
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
