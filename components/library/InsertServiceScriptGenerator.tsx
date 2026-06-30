"use client";

import { useEffect, useMemo, useState } from "react";
import { LuaCodePreview } from "@/components/ui/LuaCodePreview";
import { IconCheck, IconCopy, IconModel, IconAudio, IconX } from "@/components/ui/Icon";
import {
  buildInsertServiceScript,
  countInsertScriptAssets,
  DEFAULT_INSERT_SCRIPT_OPTIONS,
  getInsertAssetKind,
  getInsertScriptFilename,
  type InsertScriptAsset,
  type InsertScriptFormat,
  type InsertScriptLayout,
  type InsertScriptOptions,
  type InsertScriptParent,
} from "@/lib/insert-service-script";

interface InsertServiceScriptGeneratorProps {
  assets: InsertScriptAsset[];
  open: boolean;
  onClose: () => void;
}

const PARENT_OPTIONS: { value: InsertScriptParent; label: string }[] = [
  { value: "Workspace", label: "Workspace" },
  { value: "ReplicatedStorage", label: "ReplicatedStorage" },
  { value: "ServerStorage", label: "ServerStorage" },
  { value: "ServerScriptService", label: "ServerScriptService" },
];

const FORMAT_OPTIONS: { value: InsertScriptFormat; label: string; hint: string }[] = [
  {
    value: "server",
    label: "Server script",
    hint: "Drop into ServerScriptService for Play Solo or live servers.",
  },
  {
    value: "module",
    label: "ModuleScript",
    hint: "require() from plugins or bootstrap scripts.",
  },
  {
    value: "command-bar",
    label: "Command Bar",
    hint: "One paste in Studio — instant workspace preview.",
  },
];

export function InsertServiceScriptGenerator({
  assets,
  open,
  onClose,
}: InsertServiceScriptGeneratorProps) {
  const [options, setOptions] = useState<InsertScriptOptions>(DEFAULT_INSERT_SCRIPT_OPTIONS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const script = useMemo(
    () => buildInsertServiceScript(assets, options),
    [assets, options],
  );

  const filename = useMemo(() => getInsertScriptFilename(assets), [assets]);

  const assetCounts = useMemo(() => countInsertScriptAssets(assets), [assets]);
  const hasAudio = assetCounts.audio > 0;
  const hasPackages = assetCounts.packages > 0;

  const summaryLabel = useMemo(() => {
    const parts: string[] = [];
    if (hasPackages) {
      parts.push(`${assetCounts.packages} package${assetCounts.packages === 1 ? "" : "s"}`);
    }
    if (hasAudio) {
      parts.push(`${assetCounts.audio} sound${assetCounts.audio === 1 ? "" : "s"}`);
    }
    return parts.join(" · ");
  }, [assetCounts, hasAudio, hasPackages]);

  if (!open) {
    return null;
  }

  async function copyScript() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadScript() {
    const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function patchOptions(patch: Partial<InsertScriptOptions>) {
    setOptions((current) => ({ ...current, ...patch }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92dvh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lift)] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="insert-service-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="label mb-1">Studio export</p>
            <h2
              id="insert-service-title"
              className="font-display text-lg font-medium text-[var(--text-primary)] sm:text-xl"
            >
              Studio asset loader
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Generate ready-to-paste Luau for{" "}
              <span className="font-medium text-[var(--text-secondary)]">{summaryLabel}</span>
              — InsertService packages with layout, plus Sound instances with configured{" "}
              <span className="font-mono text-[var(--text-secondary)]">SoundId</span> values.
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost shrink-0 p-2"
            onClick={onClose}
            aria-label="Close"
          >
            <IconX size={16} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <aside className="shrink-0 overflow-y-auto border-b border-[var(--border-subtle)] bg-[var(--surface-inset)] p-4 lg:border-b-0 lg:border-r">
            <div className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="label">Script format</legend>
                <div className="space-y-1.5">
                  {FORMAT_OPTIONS.map((format) => (
                    <label
                      key={format.value}
                      className={[
                        "flex cursor-pointer gap-2 rounded-lg border px-3 py-2.5 transition-colors",
                        options.format === format.value
                          ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                          : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border)]",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="script-format"
                        className="mt-0.5"
                        checked={options.format === format.value}
                        onChange={() => patchOptions({ format: format.value })}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[var(--text-primary)]">
                          {format.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                          {format.hint}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <label className="label" htmlFor="insert-parent">
                  Parent service
                </label>
                <select
                  id="insert-parent"
                  className="field-input"
                  value={options.parent}
                  onChange={(event) =>
                    patchOptions({ parent: event.target.value as InsertScriptParent })
                  }
                >
                  {PARENT_OPTIONS.map((parent) => (
                    <option key={parent.value} value={parent.value}>
                      {parent.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="label" htmlFor="insert-subfolder">
                  Subfolder path (optional)
                </label>
                <input
                  id="insert-subfolder"
                  className="field-input font-mono text-sm"
                  placeholder="Packages / Imported"
                  value={options.subfolder}
                  onChange={(event) => patchOptions({ subfolder: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="label" htmlFor="insert-layout">
                  Package spawn layout
                </label>
                <select
                  id="insert-layout"
                  className="field-input"
                  value={options.layout}
                  onChange={(event) =>
                    patchOptions({ layout: event.target.value as InsertScriptLayout })
                  }
                >
                  <option value="line">Line — spread along X axis</option>
                  <option value="grid">Grid — rows and columns</option>
                  <option value="origin">Stack at origin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="label" htmlFor="insert-spacing">
                    Spacing (studs)
                  </label>
                  <input
                    id="insert-spacing"
                    type="number"
                    min={0}
                    max={256}
                    className="field-input"
                    value={options.spacing}
                    onChange={(event) =>
                      patchOptions({ spacing: Number(event.target.value) || 0 })
                    }
                  />
                </div>
                {options.layout === "grid" ? (
                  <div className="space-y-2">
                    <label className="label" htmlFor="insert-columns">
                      Columns
                    </label>
                    <input
                      id="insert-columns"
                      type="number"
                      min={1}
                      max={12}
                      className="field-input"
                      value={options.gridColumns}
                      onChange={(event) =>
                        patchOptions({ gridColumns: Number(event.target.value) || 1 })
                      }
                    />
                  </div>
                ) : null}
              </div>

              {hasAudio ? (
                <fieldset className="space-y-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
                  <legend className="label px-1">Sound properties</legend>
                  <div className="space-y-2">
                    <label className="label" htmlFor="insert-sound-volume">
                      Volume (0–1)
                    </label>
                    <input
                      id="insert-sound-volume"
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      className="field-input"
                      value={options.soundVolume}
                      onChange={(event) =>
                        patchOptions({
                          soundVolume: Math.min(1, Math.max(0, Number(event.target.value) || 0)),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label" htmlFor="insert-sound-rolloff">
                      RollOffMaxDistance
                    </label>
                    <input
                      id="insert-sound-rolloff"
                      type="number"
                      min={0}
                      max={100000}
                      className="field-input"
                      value={options.soundRollOffMaxDistance}
                      onChange={(event) =>
                        patchOptions({
                          soundRollOffMaxDistance: Math.max(0, Number(event.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={options.soundLooped}
                      onChange={(event) => patchOptions({ soundLooped: event.target.checked })}
                    />
                    Looped
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={options.soundPlayOnInsert}
                      onChange={(event) =>
                        patchOptions({ soundPlayOnInsert: event.target.checked })
                      }
                    />
                    Play on insert
                  </label>
                </fieldset>
              ) : null}

              <div className="space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={options.pivotToGround}
                    onChange={(event) => patchOptions({ pivotToGround: event.target.checked })}
                  />
                  Pivot models to ground
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={options.usePcall}
                    onChange={(event) => patchOptions({ usePcall: event.target.checked })}
                  />
                  Wrap LoadAsset in pcall
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={options.includeComments}
                    onChange={(event) => patchOptions({ includeComments: event.target.checked })}
                  />
                  Include asset comments
                </label>
              </div>
            </div>
          </aside>

          <div className="flex min-h-0 flex-col gap-3 overflow-hidden p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              {assets.map((asset) => {
                const Icon = getInsertAssetKind(asset.type) === "audio" ? IconAudio : IconModel;
                return (
                  <span
                    key={`${asset.assetId}-${asset.name}`}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-inset)] px-2.5 py-1 font-mono text-[10px] text-[var(--text-secondary)]"
                  >
                    <Icon size={11} className="shrink-0 text-[var(--accent)]" />
                    <span className="truncate">{asset.name}</span>
                    <span className="text-[var(--text-faint)]">{asset.assetId}</span>
                  </span>
                );
              })}
            </div>

            <LuaCodePreview
              code={script}
              filename={filename}
              className="min-h-0 flex-1"
              maxHeight="min(28rem, 42vh)"
            />

            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={copyScript}>
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                {copied ? "Copied" : "Copy script"}
              </button>
              <button type="button" className="btn-secondary" onClick={downloadScript}>
                Download .lua
              </button>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InsertServiceScriptTriggerProps {
  assets: InsertScriptAsset[];
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function InsertServiceScriptTrigger({
  assets,
  disabled = false,
  label,
  className = "btn-primary",
}: InsertServiceScriptTriggerProps) {
  const [open, setOpen] = useState(false);
  const count = assets.length;
  const defaultLabel =
    count === 0
      ? "Load in Studio"
      : count === 1
        ? "Load in Studio"
        : `Load ${count} in Studio`;

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled || count === 0}
        onClick={() => setOpen(true)}
        title="Generate Luau to load packages and sounds in Studio"
      >
        <IconModel size={14} />
        {label ?? defaultLabel}
      </button>
      <InsertServiceScriptGenerator
        assets={assets}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
