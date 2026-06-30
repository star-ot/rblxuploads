"use client";
/* eslint-disable @next/next/no-img-element */

import type { UploadQueueItem } from "@/lib/types";
import { IconAudio, IconImage, IconModel, IconX } from "@/components/ui/Icon";

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

function AssetThumbnail({ item }: { item: UploadQueueItem }) {
  if (item.assetType === "Image") {
    return (
      <img
        src={item.previewUrl}
        alt=""
        className="h-12 w-12 rounded-md border border-[var(--border-subtle)] object-cover"
      />
    );
  }

  const Icon =
    item.assetType === "Audio"
      ? IconAudio
      : item.assetType === "Model" || item.assetType === "Mesh"
        ? IconModel
        : IconImage;

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-inset)] text-[var(--text-muted)]">
      <Icon size={18} />
    </div>
  );
}

export function AssetCard({
  item,
  disabled = false,
  onNameChange,
  onRemove,
}: AssetCardProps) {
  const isLocked =
    item.status === "uploading" || item.status === "processing";

  return (
    <article className="surface-interactive group grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3 sm:grid-cols-[48px_1fr_auto] sm:items-start">
      <AssetThumbnail item={item} />

      <div className="min-w-0 space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`status-chip ${STATUS_CLASS[item.status]}`}>
            {STATUS_LABELS[item.status]}
          </span>
          <span className="status-chip status-waiting">{item.assetType}</span>
          <span className="truncate font-mono text-[11px] text-[var(--text-faint)]">
            {item.fileName}
          </span>
        </div>

        <label className="flex flex-col gap-1">
          <span className="label">Display name</span>
          <input
            value={item.assetName}
            onChange={(event) => onNameChange(item.id, event.target.value)}
            className="field-input py-1.5 text-sm"
            disabled={disabled || isLocked}
          />
        </label>

        {(isLocked || item.progress > 0) && item.status !== "complete" ? (
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
            <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-faint)]">
              <span>{item.progress}%</span>
              {item.attempt > 0 ? <span>Attempt {item.attempt}</span> : null}
            </div>
          </div>
        ) : null}

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
        className="btn-ghost self-start p-1.5 opacity-60 group-hover:opacity-100"
        onClick={() => onRemove(item.id)}
        disabled={disabled || isLocked}
        aria-label={`Remove ${item.fileName}`}
      >
        <IconX size={14} />
      </button>
    </article>
  );
}
