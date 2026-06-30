"use client";

import { useState } from "react";
import type { LocalAssetRecord } from "@/lib/types";
import {
  applyMergeResolutions,
  planLibraryMerge,
  type MergeConflictResolution,
} from "@/lib/library/merge";
import { normalizeImportedAssets, parseLibraryImport } from "@/lib/library/import";

interface LibrarySyncModalProps {
  open: boolean;
  localAssets: LocalAssetRecord[];
  onClose: () => void;
  onMerge: (assets: LocalAssetRecord[], folders: string[]) => Promise<void>;
}

export function LibrarySyncModal({
  open,
  localAssets,
  onClose,
  onMerge,
}: LibrarySyncModalProps) {
  const [remoteAssets, setRemoteAssets] = useState<LocalAssetRecord[]>([]);
  const [remoteFolders, setRemoteFolders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [resolutions, setResolutions] = useState<Map<string, MergeConflictResolution>>(
    () => new Map(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const plan =
    remoteAssets.length > 0
      ? planLibraryMerge(localAssets, remoteAssets)
      : null;

  async function handleFile(file: File) {
    setError("");
    try {
      const parsed = parseLibraryImport(await file.text());
      const normalized = normalizeImportedAssets(parsed.assets);
      setRemoteAssets(normalized);
      setRemoteFolders(parsed.folders);
      setFileName(file.name);
      setResolutions(new Map());
    } catch {
      setError("Could not parse library file. Use JSON export or library.manifest.json.");
    }
  }

  async function applyMerge() {
    if (!plan) return;
    setBusy(true);
    try {
      const merged = applyMergeResolutions(plan, resolutions);
      await onMerge(merged, remoteFolders);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel max-w-lg"
        role="dialog"
        aria-labelledby="sync-title"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="sync-title" className="font-display text-base font-medium text-[var(--text-primary)]">
          Sync from repo
        </h2>
        <p className="caption mt-1">
          Pick a <span className="font-mono text-[var(--text-secondary)]">library.manifest.json</span>{" "}
          from disk and merge with your local IndexedDB library.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-inset)] px-4 py-6 text-center">
          <span className="text-sm text-[var(--text-secondary)]">
            {fileName || "Choose library JSON file"}
          </span>
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <span className="btn-secondary mx-auto text-xs">Browse file</span>
        </label>

        {error ? <p className="alert alert-error mt-3 text-sm">{error}</p> : null}

        {plan && plan.conflicts.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="label">Conflicts ({plan.conflicts.length})</p>
            {plan.conflicts.map((conflict) => (
              <div
                key={conflict.assetId}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3"
              >
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  rbxassetid://{conflict.assetId}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Local: {conflict.local.name} · Remote: {conflict.remote.name}
                </p>
                <select
                  className="field-input mt-2 text-xs"
                  value={resolutions.get(conflict.assetId) ?? "keep-remote"}
                  onChange={(event) => {
                    const next = new Map(resolutions);
                    next.set(
                      conflict.assetId,
                      event.target.value as MergeConflictResolution,
                    );
                    setResolutions(next);
                  }}
                >
                  <option value="keep-remote">Keep remote (Git canonical)</option>
                  <option value="keep-local">Keep local</option>
                  <option value="keep-both">Keep both</option>
                </select>
              </div>
            ))}
          </div>
        ) : null}

        {plan ? (
          <p className="mt-3 text-xs text-[var(--text-faint)]">
            {plan.remoteOnly.length} new from repo · {plan.localOnly.length} local-only ·{" "}
            {plan.conflicts.length} conflicts
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void applyMerge()}
            disabled={!plan || busy}
          >
            {busy ? "Merging…" : "Merge into library"}
          </button>
        </div>
      </div>
    </div>
  );
}
