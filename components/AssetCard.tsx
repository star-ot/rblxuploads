"use client";
/* eslint-disable @next/next/no-img-element */

import type { UploadQueueItem } from "@/lib/types";

interface AssetCardProps {
  item: UploadQueueItem;
  disabled?: boolean;
  onNameChange: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

const STATUS_LABELS: Record<UploadQueueItem["status"], string> = {
  waiting: "Queued",
  uploading: "Sending",
  processing: "Roblox",
  complete: "Done",
  failed: "Error",
};

const STATUS_CLASS: Record<UploadQueueItem["status"], string> = {
  waiting: "status-waiting",
  uploading: "status-uploading",
  processing: "status-processing",
  complete: "status-complete",
  failed: "status-failed",
};

export function AssetCard({
  item,
  disabled = false,
  onNameChange,
  onRemove,
}: AssetCardProps) {
  const isLocked =
    item.status === "uploading" || item.status === "processing";

  return (
    <article className="grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3 sm:grid-cols-[56px_1fr_auto] sm:items-start">
      <img
        src={item.previewUrl}
        alt={item.assetName}
        className="h-14 w-14 rounded-md border border-[var(--border)] object-cover"
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`status-chip ${STATUS_CLASS[item.status]}`}>
            {STATUS_LABELS[item.status]}
          </span>
          <span className="truncate font-mono text-[11px] text-[var(--text-muted)]">
            {item.fileName}
          </span>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Asset name
          </span>
          <input
            value={item.assetName}
            onChange={(event) => onNameChange(item.id, event.target.value)}
            className="field-input py-1.5 text-sm"
            disabled={disabled || isLocked}
          />
        </label>

        <div className="space-y-1">
          <div className="progress-track">
            <div
              className={[
                "progress-fill",
                isLocked ? "progress-fill-animated" : "",
              ].join(" ")}
              style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-muted)]">
            <span>{item.progress}%</span>
            <span>try {item.attempt}</span>
          </div>
        </div>

        {item.error ? (
          <p className="text-xs leading-relaxed text-[var(--danger-text)]">{item.error}</p>
        ) : null}
        {item.assetId ? (
          <p className="font-mono text-[11px] text-[var(--success-text)]">
            rbxassetid://{item.assetId}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        className="btn-secondary self-start px-2 py-1 text-xs"
        onClick={() => onRemove(item.id)}
        disabled={disabled || isLocked}
      >
        Remove
      </button>
    </article>
  );
}
