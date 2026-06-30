"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState } from "react";
import {
  getAssetVersionOptions,
  getVersionCount,
  type AssetVersionOption,
} from "@/lib/library/versioning";
import { formatLibraryAssetDate } from "@/lib/library-sort";
import type { AssetType, LocalAssetRecord } from "@/lib/types";

interface LibraryVersionSelectorProps {
  asset: LocalAssetRecord;
  selectedAssetId: string;
  onSelect: (assetId: string) => void;
  getTypeGlyph: (type: AssetType) => string;
  onQueueNewVersion?: () => void;
}

export function LibraryVersionSelector({
  asset,
  selectedAssetId,
  onSelect,
  getTypeGlyph,
  onQueueNewVersion,
}: LibraryVersionSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const options = getAssetVersionOptions(asset);
  const selected =
    options.find((option) => option.assetId === selectedAssetId) ?? options[0];
  const versionCount = getVersionCount(asset);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="library-version-selector" ref={rootRef}>
      <button
        type="button"
        className={[
          "library-version-trigger",
          open ? "library-version-trigger-open" : "",
          selected && !selected.isCurrent ? "library-version-trigger-prior" : "",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="library-version-trigger-label">{selected?.label ?? "Current"}</span>
        <span className="library-version-trigger-meta">v{versionCount}</span>
        <span className="library-version-trigger-chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div className="library-version-menu" role="listbox" id={listId} aria-label="Asset versions">
          <div className="library-version-menu-header">
            <span className="library-version-menu-title">Version history</span>
            <span className="library-version-menu-count">{versionCount} total</span>
          </div>

          <ul className="library-version-options">
            {options.map((option) => (
              <li key={`${option.assetId}-${option.replacedAt}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.assetId === selected?.assetId}
                  className={[
                    "library-version-option",
                    option.assetId === selected?.assetId ? "library-version-option-active" : "",
                  ].join(" ")}
                  onClick={() => {
                    onSelect(option.assetId);
                    setOpen(false);
                  }}
                >
                  <VersionPreview
                    option={option}
                    type={asset.type}
                    getTypeGlyph={getTypeGlyph}
                    size="sm"
                  />
                  <span className="library-version-option-body">
                    <span className="library-version-option-label">{option.label}</span>
                    <span className="library-version-option-id">{option.assetId}</span>
                    <span className="library-version-option-date">
                      {formatLibraryAssetDate(option.replacedAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {onQueueNewVersion ? (
            <button
              type="button"
              className="library-version-new-btn"
              onClick={() => {
                setOpen(false);
                onQueueNewVersion();
              }}
            >
              Upload new version…
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function VersionPreview({
  option,
  type,
  getTypeGlyph,
  size,
}: {
  option: AssetVersionOption;
  type: AssetType;
  getTypeGlyph: (type: AssetType) => string;
  size: "sm" | "md";
}) {
  const className = [
    "library-version-preview",
    size === "md" ? "library-version-preview-md" : "library-version-preview-sm",
  ].join(" ");

  if (option.thumbnailDataUrl) {
    return <img src={option.thumbnailDataUrl} alt="" className={className} />;
  }

  return (
    <div className={`${className} library-version-preview-fallback`} aria-hidden>
      {getTypeGlyph(type)}
    </div>
  );
}
