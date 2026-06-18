"use client";

import type { UploadQueueItem } from "@/lib/types";
import { AssetCard } from "@/components/AssetCard";

interface UploadQueueProps {
  items: UploadQueueItem[];
  isRunning: boolean;
  progressPercent: number;
  completedCount: number;
  etaLabel: string;
  onStart: () => void;
  onRetryFailed: () => void;
  onClearFinished: () => void;
  onNameChange: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export function UploadQueue({
  items,
  isRunning,
  progressPercent,
  completedCount,
  etaLabel,
  onStart,
  onRetryFailed,
  onClearFinished,
  onNameChange,
  onRemove,
}: UploadQueueProps) {
  const total = items.length;
  const hasFailed = items.some((item) => item.status === "failed");

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Upload Queue</h2>
          <p className="text-sm text-zinc-400">
            {completedCount} / {total} complete
            {etaLabel ? ` - ETA ${etaLabel}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onStart}
            disabled={isRunning || total === 0}
          >
            {isRunning ? "Uploading..." : "Start Upload"}
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onRetryFailed}
            disabled={isRunning || !hasFailed}
          >
            Retry Failed
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onClearFinished}
            disabled={isRunning}
          >
            Clear Finished
          </button>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-6 text-center text-sm text-zinc-500">
          Add files to build your queue.
        </div>
      ) : (
        <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <AssetCard
              key={item.id}
              item={item}
              disabled={isRunning}
              onNameChange={onNameChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </section>
  );
}
