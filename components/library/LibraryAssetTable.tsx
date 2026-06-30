"use client";

import type { ReactNode } from "react";
import { LibraryAssetTableHead } from "@/components/library/LibraryAssetTableHead";
import { LibraryAssetTags } from "@/components/library/LibraryAssetTags";
import { LibraryAssetNameCell } from "@/components/library/LibraryAssetNameCell";
import { LibraryAssetThumb } from "@/components/library/LibraryAssetThumb";
import { LibraryVersionSelector } from "@/components/library/LibraryVersionSelector";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCopy } from "@/components/ui/Icon";
import { getAssetTypeGlyph } from "@/lib/library/asset-glyphs";
import { formatLibraryAssetDate, type LibrarySortColumn, type LibrarySortState } from "@/lib/library-sort";
import { resolveAssetVersionView } from "@/lib/library/versioning";
import type { AssetType, LocalAssetRecord } from "@/lib/types";

interface LibraryAssetTableProps {
  assets: LocalAssetRecord[];
  sort: LibrarySortState;
  onSort: (column: LibrarySortColumn) => void;
  selectedAssetIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  viewVersionByAssetId?: Record<string, string>;
  onViewVersionChange?: (libraryAssetId: string, rbxAssetId: string) => void;
  onTagClick?: (tag: string) => void;
  onAddTag?: (assetId: string, tag: string) => void;
  onRemoveTag?: (assetId: string, tag: string) => void;
  onQueueNewVersion?: (asset: LocalAssetRecord) => void;
  showVersions?: boolean;
  getTypeGlyph?: (type: AssetType) => string;
  emptyState: {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
  };
}

export function LibraryAssetTable({
  assets,
  sort,
  onSort,
  selectedAssetIds,
  onSelectionChange,
  viewVersionByAssetId = {},
  onViewVersionChange,
  onTagClick,
  onAddTag,
  onRemoveTag,
  onQueueNewVersion,
  showVersions = true,
  getTypeGlyph = getAssetTypeGlyph,
  emptyState,
}: LibraryAssetTableProps) {
  const allSelected = assets.length > 0 && assets.every((asset) => selectedAssetIds.has(asset.id));

  if (assets.length === 0) {
    return (
      <div className="library-table-panel overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
        />
      </div>
    );
  }

  return (
    <div className="library-table-panel overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
      <table className="data-table">
        <LibraryAssetTableHead
          sort={sort}
          onSort={onSort}
          allSelected={allSelected}
          onSelectAll={(checked) => {
            if (checked) {
              onSelectionChange(new Set(assets.map((asset) => asset.id)));
            } else {
              onSelectionChange(new Set());
            }
          }}
          showVersions={showVersions}
        />
        <tbody>
          {assets.map((asset) => {
            const versionView = showVersions
              ? resolveAssetVersionView(asset, viewVersionByAssetId[asset.id])
              : null;
            const viewingPrior = versionView ? !versionView.isCurrent : false;

            return (
              <tr
                key={asset.id}
                draggable
                className={[
                  "cursor-grab active:cursor-grabbing",
                  viewingPrior ? "library-row-viewing-prior" : "",
                ].join(" ")}
                onDragStart={(event) => {
                  const ids = selectedAssetIds.has(asset.id)
                    ? Array.from(selectedAssetIds)
                    : [asset.id];
                  event.dataTransfer.setData(
                    "application/x-rblxuploads-assets",
                    JSON.stringify(ids),
                  );
                  event.dataTransfer.effectAllowed = "move";
                }}
              >
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${asset.name}`}
                    checked={selectedAssetIds.has(asset.id)}
                    onChange={(event) => {
                      const next = new Set(selectedAssetIds);
                      if (event.target.checked) {
                        next.add(asset.id);
                      } else {
                        next.delete(asset.id);
                      }
                      onSelectionChange(next);
                    }}
                  />
                </td>
                <td className="library-asset-thumb-cell hidden sm:table-cell">
                  <LibraryAssetThumb
                    asset={{
                      thumbnailDataUrl: versionView?.thumbnailDataUrl ?? asset.thumbnailDataUrl,
                      type: asset.type,
                    }}
                    getTypeGlyph={getTypeGlyph}
                  />
                </td>
                <LibraryAssetNameCell
                  asset={{
                    name: asset.name,
                    type: asset.type,
                    thumbnailDataUrl: versionView?.thumbnailDataUrl ?? asset.thumbnailDataUrl,
                  }}
                  getTypeGlyph={getTypeGlyph}
                />
                <td className="text-[var(--text-muted)]">{asset.type}</td>
                <td>
                  <button
                    type="button"
                    className={[
                      "btn-ghost max-w-[10rem] truncate p-1 font-mono text-[11px] sm:max-w-none",
                      viewingPrior ? "text-[var(--warning-text)]" : "",
                    ].join(" ")}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `rbxassetid://${versionView?.assetId ?? asset.assetId}`,
                      )
                    }
                    title={
                      viewingPrior && versionView
                        ? `Prior version (${versionView.label})`
                        : "Click to copy"
                    }
                  >
                    <IconCopy size={12} className="mr-1 inline shrink-0" />
                    {versionView?.assetId ?? asset.assetId}
                  </button>
                </td>
                <td className="hidden font-mono text-[11px] text-[var(--text-muted)] md:table-cell">
                  {asset.folderPath}
                </td>
                <td className="hidden sm:table-cell">
                  {onAddTag && onRemoveTag ? (
                    <LibraryAssetTags
                      tags={asset.tags}
                      onAddTag={(tag) => onAddTag(asset.id, tag)}
                      onRemoveTag={(tag) => onRemoveTag(asset.id, tag)}
                      onTagClick={onTagClick}
                    />
                  ) : null}
                </td>
                <td className="hidden whitespace-nowrap text-right font-mono text-[11px] text-[var(--text-muted)] lg:table-cell">
                  {formatLibraryAssetDate(asset.createdAt)}
                </td>
                {showVersions && versionView ? (
                  <td className="library-version-cell min-w-[10.5rem] align-top">
                    <LibraryVersionSelector
                      asset={asset}
                      selectedAssetId={versionView.assetId}
                      onSelect={(assetId) => onViewVersionChange?.(asset.id, assetId)}
                      getTypeGlyph={getTypeGlyph}
                      onQueueNewVersion={
                        onQueueNewVersion ? () => onQueueNewVersion(asset) : undefined
                      }
                    />
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
