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
  waiting: "Waiting",
  uploading: "Uploading",
  processing: "Processing",
  complete: "Complete",
  failed: "Failed",
};

const STATUS_COLOR: Record<UploadQueueItem["status"], string> = {
  waiting: "bg-zinc-700 text-zinc-100",
  uploading: "bg-blue-600/80 text-blue-50",
  processing: "bg-amber-500/80 text-amber-50",
  complete: "bg-emerald-600/80 text-emerald-50",
  failed: "bg-rose-600/80 text-rose-50",
};

export function AssetCard({
  item,
  disabled = false,
  onNameChange,
  onRemove,
}: AssetCardProps) {
  return (
    <article className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 sm:grid-cols-[64px_1fr_auto] sm:items-center">
      <img
        src={item.previewUrl}
        alt={item.assetName}
        className="h-16 w-16 rounded-md border border-zinc-800 object-cover"
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLOR[item.status]}`}>
            {STATUS_LABELS[item.status]}
          </span>
          <span className="text-xs text-zinc-500">{item.fileName}</span>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">Roblox asset name</span>
          <input
            value={item.assetName}
            onChange={(event) => onNameChange(item.id, event.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 outline-none transition focus:border-zinc-500 disabled:cursor-not-allowed"
            disabled={
              disabled || item.status === "uploading" || item.status === "processing"
            }
          />
        </label>

        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{item.progress}%</span>
            <span>Attempt {item.attempt}</span>
          </div>
        </div>

        {item.error ? <p className="text-xs text-rose-400">{item.error}</p> : null}
        {item.assetId ? (
          <p className="text-xs text-emerald-400">rbxassetid://{item.assetId}</p>
        ) : null}
      </div>

      <div className="flex items-start justify-end">
        <button
          type="button"
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onRemove(item.id)}
          disabled={
            disabled || item.status === "uploading" || item.status === "processing"
          }
        >
          Remove
        </button>
      </div>
    </article>
  );
}
