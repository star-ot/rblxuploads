"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { IconAudio, IconCopy, IconImage, IconModel } from "@/components/ui/Icon";
import { formatRobloxAssetName } from "@/lib/name-formatter";
import { DEMO_LIBRARY_ASSETS } from "@/lib/demo-library-assets";
import type { AssetType } from "@/lib/types";

const DEMO_RESULTS = DEMO_LIBRARY_ASSETS.slice(0, 3).map((asset) => ({
  id: asset.id,
  assetType: asset.type,
  assetName: asset.name,
  assetId: asset.assetId,
  thumbnail: asset.thumbnailDataUrl,
}));

function ResultThumbnail({
  assetType,
  thumbnail,
}: {
  assetType: AssetType;
  thumbnail?: string;
}) {
  if (assetType === "Image" && thumbnail) {
    return (
      <img
        src={thumbnail}
        alt=""
        className="h-8 w-8 rounded border border-[var(--border-subtle)] object-cover"
      />
    );
  }

  const Icon =
    assetType === "Audio" ? IconAudio : assetType === "Model" || assetType === "Mesh" ? IconModel : IconImage;

  return (
    <div className="relative h-8 w-8 overflow-hidden rounded border border-[var(--border-subtle)]">
      {thumbnail ? (
        <img src={thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-inset)] text-[var(--text-muted)]">
        <Icon size={14} />
      </div>
    </div>
  );
}

export function LandingCopyDemo() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyAll() {
    const text = DEMO_RESULTS.map(
      (item) => `[${item.assetType}] ${item.assetName}: rbxassetid://${item.assetId}`,
    ).join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedId("all");
    window.setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label">Results panel</p>
          <p className="caption">Same copy-all format as the workspace.</p>
        </div>
        <button type="button" onClick={copyAll} className="btn-secondary px-3 py-1.5 text-[12px]">
          <IconCopy size={14} />
          {copiedId === "all" ? "Copied" : "Copy all IDs"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-12" />
              <th>Name</th>
              <th className="hidden sm:table-cell">Asset ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_RESULTS.map((item) => (
              <tr key={item.id}>
                <td>
                  <ResultThumbnail assetType={item.assetType} thumbnail={item.thumbnail} />
                </td>
                <td className="font-medium text-[var(--text-primary)]">{item.assetName}</td>
                <td className="hidden font-mono text-[11px] text-[var(--success-text)] sm:table-cell">
                  rbxassetid://{item.assetId}
                </td>
                <td>
                  <span className="status-chip status-complete">Done</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SAMPLE_FILES = [
  "icon_inventory.png",
  "sfx_click_soft.ogg",
  "hero_body_mesh.fbx",
  "tree_cluster.rbxm",
] as const;

export function LandingNameFormatterDemo() {
  const [selected, setSelected] = useState(0);
  const fileName = SAMPLE_FILES[selected];
  const formatted = useMemo(() => formatRobloxAssetName(fileName), [fileName]);

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-4">
      <p className="label mb-1">Display name formatter</p>
      <p className="caption mb-3">Pick a filename — see the Roblox name update live.</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {SAMPLE_FILES.map((file, index) => (
          <button
            key={file}
            type="button"
            onClick={() => setSelected(index)}
            className={`rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${
              selected === index
                ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {file}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="label">Filename</span>
          <input value={fileName} readOnly className="field-input py-1.5 font-mono text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Display name</span>
          <input value={formatted} readOnly className="field-input py-1.5 text-sm" />
        </label>
      </div>
    </div>
  );
}

export function LandingQueueStatusDemo() {
  const statuses = [
    { label: "Queued", className: "status-waiting", file: "lobby_loop.mp3" },
    { label: "Sending", className: "status-uploading", file: "icon_settings.png", progress: 64 },
    { label: "Roblox", className: "status-processing", file: "hero_body.mesh", progress: 38 },
    { label: "Done", className: "status-complete", file: "click_soft.ogg", assetId: "9123847102" },
  ] as const;

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-4">
      <p className="label mb-1">Queue statuses</p>
      <p className="caption mb-3">Every state you see during a real batch upload.</p>
      <div className="space-y-2">
        {statuses.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-2.5"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`status-chip ${item.className}`}>{item.label}</span>
              <span className="font-mono text-[11px] text-[var(--text-faint)]">{item.file}</span>
            </div>
            {"progress" in item ? (
              <div className="mt-2 space-y-1">
                <div className="progress-track">
                  <div
                    className="progress-fill progress-fill-animated"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-[var(--text-faint)]">
                  {item.progress}%
                </span>
              </div>
            ) : null}
            {"assetId" in item ? (
              <p className="mt-1.5 font-mono text-[11px] text-[var(--success-text)]">
                rbxassetid://{item.assetId}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

const DEMO_MODEL = DEMO_LIBRARY_ASSETS.find((asset) => asset.type === "Model")!;

export function LandingModelPackageDemo() {
  const [status, setStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [fileLabel, setFileLabel] = useState("tree_cluster_v2.fbx");

  async function simulateUpdate() {
    setUpdating(true);
    setStatus("Updating model package…");
    await new Promise((resolve) => window.setTimeout(resolve, 1100));
    setUpdating(false);
    setStatus(`Model package updated for asset ${DEMO_MODEL.assetId}.`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-4">
        <p className="label mb-1">1 · Upload creates a package</p>
        <p className="caption mb-4">
          FBX, RBXM, GLTF, and GLB upload as Roblox Model assets — full packages, not loose
          instances.
        </p>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
          <div className="flex gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[var(--border-subtle)]">
              {DEMO_MODEL.thumbnailDataUrl ? (
                <img
                  src={DEMO_MODEL.thumbnailDataUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 text-[var(--text-muted)]">
                <IconModel size={18} />
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="status-chip status-complete">Done</span>
                <span className="status-chip status-waiting">Model</span>
                <span className="status-chip status-processing">Package</span>
              </div>
              <p className="font-medium text-[var(--text-primary)]">{DEMO_MODEL.name}</p>
              <p className="font-mono text-[11px] text-[var(--text-faint)]">{DEMO_MODEL.fileName}</p>
              <p className="font-mono text-[11px] text-[var(--success-text)]">{DEMO_MODEL.assetUri}</p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-muted)]">
          You get a new <span className="font-mono text-[var(--text-secondary)]">rbxassetid</span>{" "}
          pointing at the published package — ready to reference in Studio or scripts.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-4">
        <p className="label mb-1">2 · Update overwrites the package</p>
        <p className="caption mb-4">
          Same panel as the workspace library. Target an existing model asset ID and send a new FBX
          via Open Cloud <span className="font-mono">PATCH</span> — the ID stays put.
        </p>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="label">Target model asset ID</span>
              <input
                value={DEMO_MODEL.assetId}
                readOnly
                className="field-input py-1.5 font-mono text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="label">Display name (optional)</span>
              <input
                value={DEMO_MODEL.name}
                readOnly
                className="field-input py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="label">Replacement FBX</span>
              <select
                value={fileLabel}
                onChange={(event) => setFileLabel(event.target.value)}
                className="field-input py-1.5 font-mono text-sm"
              >
                <option value="tree_cluster_v2.fbx">tree_cluster_v2.fbx</option>
                <option value="tree_cluster_lod1.fbx">tree_cluster_lod1.fbx</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={simulateUpdate}
              disabled={updating}
            >
              {updating ? "Updating…" : "Update package"}
            </button>
            <span className="font-mono text-[11px] text-[var(--text-faint)]">
              ID unchanged · references safe
            </span>
          </div>
          {status ? (
            <p className="alert alert-info mt-3 text-[13px]" role="status">
              {status}
            </p>
          ) : null}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-muted)]">
          Iterating on a mesh? Push revisions without re-wiring{" "}
          <span className="font-mono text-[var(--text-secondary)]">rbxassetid://</span> across your
          place files.
        </p>
      </div>
    </div>
  );
}
