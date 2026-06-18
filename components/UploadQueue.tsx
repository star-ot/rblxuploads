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
  const waitingCount = items.filter((item) => item.status === "waiting").length;

  return (
    <section className="panel h-full">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-[var(--text-primary)]">Queue</h2>
          <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
            {completedCount}/{total} finished
            {waitingCount > 0 ? ` · ${waitingCount} waiting` : ""}
            {etaLabel ? ` · ~${etaLabel} left` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={onStart}
            disabled={isRunning || waitingCount === 0}
          >
            {isRunning ? "Running…" : "Start batch"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onRetryFailed}
            disabled={isRunning || !hasFailed}
          >
            Retry errors
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClearFinished}
            disabled={isRunning}
          >
            Clear done
          </button>
        </div>
      </div>

      <div className="progress-track mb-4">
        <div
          className={["progress-fill", isRunning ? "progress-fill-animated" : ""].join(
            " ",
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-inset)] p-8 text-center text-sm text-[var(--text-muted)]">
          Queue is empty — add images on the left.
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
