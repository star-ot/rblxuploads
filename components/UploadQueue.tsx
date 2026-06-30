"use client";

import type { UploadQueueItem } from "@/lib/types";
import { AssetCard } from "@/components/AssetCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconQueue } from "@/components/ui/Icon";

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
    <section className="panel flex flex-col">
      <SectionHeader
        title="Upload queue"
        meta={
          <>
            {completedCount}/{total} complete
            {waitingCount > 0 ? ` · ${waitingCount} waiting` : ""}
            {etaLabel ? ` · ~${etaLabel} remaining` : ""}
          </>
        }
        action={
          <>
            <button
              type="button"
              className="btn-primary"
              onClick={onStart}
              disabled={isRunning || waitingCount === 0}
            >
              {isRunning ? "Uploading…" : "Start upload"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onRetryFailed}
              disabled={isRunning || !hasFailed}
            >
              Retry failed
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={onClearFinished}
              disabled={isRunning}
            >
              Clear finished
            </button>
          </>
        }
      />

      {total > 0 ? (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-[var(--text-faint)]">
            <span>Batch progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="progress-track">
            <div
              className={["progress-fill", isRunning ? "progress-fill-animated" : ""].join(
                " ",
              )}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon={<IconQueue size={18} />}
          title="Queue is empty"
          description="Add files from the panel on the left. They'll appear here ready to upload."
        />
      ) : (
        <div className="max-h-[36rem] flex-1 space-y-2 overflow-y-auto pr-1">
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
