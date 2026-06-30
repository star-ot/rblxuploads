"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { LibraryGooeySearch } from "@/components/library/LibraryGooeySearch";
import {
  ALL_FOLDERS_OPTION,
  LibraryFolderPanel,
} from "@/components/library/LibraryFolderPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCopy, IconSearch } from "@/components/ui/Icon";
import {
  filterDemoLibraryAssets,
  getAssetTypeGlyph,
} from "@/lib/demo-library-assets";
import {
  createDemoFolder,
  createInitialDemoLibraryState,
  deleteDemoFolderTree,
  moveDemoAssets,
  renameDemoFolderTree,
} from "@/lib/demo-library-state";
import {
  buildFolderTree,
  buildNestedAssetCounts,
  computeRenamedFolderPath,
  getFolderAncestors,
  joinFolderPath,
  ROOT_FOLDER,
} from "@/lib/folder-tree";
import { normalizeFolderPath } from "@/lib/local-assets-db";
import type { AssetType, LocalAssetRecord } from "@/lib/types";

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "type";

function AssetPreviewThumb({ asset }: { asset: LocalAssetRecord }) {
  if (asset.thumbnailDataUrl) {
    return (
      <img
        src={asset.thumbnailDataUrl}
        alt=""
        className="h-8 w-8 rounded border border-[var(--border-subtle)] object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--surface-inset)] text-[10px] font-medium text-[var(--text-muted)]">
      {getAssetTypeGlyph(asset.type)}
    </div>
  );
}

export function LandingDemoLibrary() {
  const [library, setLibrary] = useState(createInitialDemoLibraryState);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const [folderFilter, setFolderFilter] = useState(ALL_FOLDERS_OPTION);
  const [tagFilter, setTagFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState(ROOT_FOLDER);
  const [expandedFolderPaths, setExpandedFolderPaths] = useState<Set<string>>(
    () => new Set([ROOT_FOLDER]),
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const { assets, folders } = library;

  const filteredAssets = useMemo(() => {
    const tagText = tagFilter.trim().toLowerCase();

    const next = filterDemoLibraryAssets(assets, {
      search,
      typeFilter,
      folderFilter,
    }).filter((asset) => {
      if (!tagText) {
        return true;
      }
      return asset.tags.some((tag) => tag.toLowerCase().includes(tagText));
    });

    next.sort((a, b) => {
      switch (sortKey) {
        case "oldest":
          return a.createdAt - b.createdAt;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "type":
          return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
        case "newest":
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return next;
  }, [assets, folderFilter, search, sortKey, tagFilter, typeFilter]);

  const folderPaths = useMemo(() => {
    const unique = new Set<string>(folders);
    assets.forEach((asset) => unique.add(asset.folderPath));
    unique.add(ROOT_FOLDER);
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [assets, folders]);

  const folderTree = useMemo(() => buildFolderTree(folderPaths), [folderPaths]);
  const nestedFolderAssetCounts = useMemo(() => buildNestedAssetCounts(assets), [assets]);
  const selectedCount = selectedAssetIds.size;

  function expandToFolder(folderPath: string) {
    setExpandedFolderPaths((current) => {
      const next = new Set(current);
      for (const ancestor of getFolderAncestors(folderPath)) {
        next.add(ancestor);
      }
      return next;
    });
  }

  function toggleFolderExpansion(folderPath: string) {
    setExpandedFolderPaths((current) => {
      const next = new Set(current);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }

  function selectFolder(folderPath: string) {
    setFolderFilter(folderPath);
    setSelectedFolder(folderPath);
    expandToFolder(folderPath);
  }

  function selectAllAssets() {
    setFolderFilter(ALL_FOLDERS_OPTION);
    setSelectedFolder(ROOT_FOLDER);
  }

  function clearFilters() {
    setSearch("");
    setTagFilter("");
    setTypeFilter("all");
    setSortKey("newest");
    setFolderFilter(ALL_FOLDERS_OPTION);
    setSelectedFolder(ROOT_FOLDER);
  }

  async function handleCreateFolder(parentPath: string, name: string) {
    if (!name.trim()) {
      setStatusMessage("Enter a folder name first.");
      return;
    }

    const created = joinFolderPath(parentPath, name);
    setLibrary((current) => ({
      ...current,
      folders: createDemoFolder(current.folders, parentPath, name),
    }));
    setSelectedFolder(created);
    setFolderFilter(created);
    expandToFolder(created);
    setStatusMessage(`Created folder: ${created}`);
  }

  async function handleRenameFolder(folderPath: string, newName: string) {
    const source = normalizeFolderPath(folderPath);
    const target = computeRenamedFolderPath(source, newName);

    if (source === ROOT_FOLDER) {
      setStatusMessage("The root folder cannot be renamed.");
      return;
    }
    if (source === target) {
      return;
    }

    try {
      const result = renameDemoFolderTree(library, source, target);
      setLibrary(result);
      setSelectedFolder(target);
      setFolderFilter(target);
      expandToFolder(target);
      setStatusMessage(
        `Renamed ${result.renamedFolders} folders and moved ${result.movedAssets} assets to ${target}.`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Folder rename failed.");
    }
  }

  async function handleReparentFolder(folderPath: string, newParentPath: string) {
    const source = normalizeFolderPath(folderPath);
    const parent = normalizeFolderPath(newParentPath);
    const name = source.split("/").pop() ?? source;
    const target = joinFolderPath(parent, name);

    if (source === ROOT_FOLDER) {
      setStatusMessage("The root folder cannot be moved.");
      return;
    }
    if (source === target) {
      setStatusMessage("Folder is already in that location.");
      return;
    }

    try {
      const result = renameDemoFolderTree(library, source, target);
      setLibrary(result);
      setSelectedFolder(target);
      setFolderFilter(target);
      expandToFolder(target);
      setStatusMessage(
        `Moved folder tree (${result.renamedFolders} folders, ${result.movedAssets} assets) to ${target}.`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Folder move failed.");
    }
  }

  async function handleDeleteFolder(folderPath: string) {
    const target = normalizeFolderPath(folderPath);
    if (target === ROOT_FOLDER) {
      setStatusMessage("Root folder cannot be deleted.");
      return;
    }

    const folderName = target.split("/").pop() ?? target;
    if (
      !window.confirm(
        `Delete "${folderName}" and all subfolders? Assets inside will move to ${ROOT_FOLDER}.`,
      )
    ) {
      return;
    }

    try {
      const result = deleteDemoFolderTree(library, target);
      setLibrary(result);
      setSelectedFolder(ROOT_FOLDER);
      setFolderFilter(ALL_FOLDERS_OPTION);
      setStatusMessage(
        `Deleted ${result.deletedFolders} folders. Moved ${result.movedAssets} assets to ${ROOT_FOLDER}.`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Folder delete failed.");
    }
  }

  async function handleMoveAssetsToFolder(folderPath: string, assetIds?: string[]) {
    const ids = assetIds ?? Array.from(selectedAssetIds);
    if (!ids.length) {
      setStatusMessage("Select assets to move first.");
      return;
    }

    const target = normalizeFolderPath(folderPath);
    setLibrary((current) => ({
      ...current,
      assets: moveDemoAssets(current.assets, ids, target),
    }));
    setSelectedAssetIds(new Set());
    setStatusMessage(`Moved ${ids.length} assets to ${target}.`);
  }

  const activeFolder =
    folderFilter === ALL_FOLDERS_OPTION
      ? "All assets"
      : folderFilter.split("/").pop() ?? folderFilter;

  return (
    <div className="panel overflow-hidden">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h3 className="font-display text-lg font-medium tracking-tight text-[var(--text-primary)]">
            Asset library
          </h3>
          <p className="caption max-w-prose">
            Full workspace preview — create folders, rename, reparent, delete, select assets, and
            drag them onto collections. Changes reset on refresh.
          </p>
          <p className="pt-1 font-mono text-xs text-[var(--text-faint)]">
            {assets.length} assets · {folderPaths.length} folders ·{" "}
            {searchOpen ? "search expanded" : "search collapsed"}
          </p>
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <LibraryGooeySearch
            value={search}
            onValueChange={setSearch}
            onOpenChange={setSearchOpen}
            collapsedWidth={240}
            expandedWidth={420}
            expandedOffset={52}
          />
        </div>
        <input
          className="field-input"
          placeholder="Filter by tag"
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
          aria-label="Filter by tag"
        />
        <div className="flex gap-2">
          <select
            className="field-input flex-1"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as AssetType | "all")}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="Image">Image</option>
            <option value="Audio">Audio</option>
            <option value="Model">Model</option>
            <option value="Mesh">Mesh</option>
          </select>
          <select
            className="field-input flex-1"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            aria-label="Sort order"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="type">Type</option>
          </select>
        </div>
        <button type="button" className="btn-ghost justify-self-start text-[13px]" onClick={clearFilters}>
          Reset filters
        </button>
      </div>

      {statusMessage ? (
        <p className="alert alert-info mt-3 text-[13px]" role="status">
          {statusMessage}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        <LibraryFolderPanel
          folderTree={folderTree}
          folderPaths={folderPaths}
          totalAssetCount={assets.length}
          nestedAssetCounts={nestedFolderAssetCounts}
          selectedFolder={selectedFolder}
          folderFilter={folderFilter}
          expandedPaths={expandedFolderPaths}
          selectedAssetCount={selectedCount}
          onSelectAllAssets={selectAllAssets}
          onSelectFolder={selectFolder}
          onToggleExpand={toggleFolderExpansion}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onReparentFolder={handleReparentFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveAssetsToFolder={handleMoveAssetsToFolder}
          onDropAssets={handleMoveAssetsToFolder}
        />

        <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
          {filteredAssets.length === 0 ? (
            <EmptyState
              icon={<IconSearch size={18} />}
              title="No assets found"
              description={
                assets.length === 0
                  ? "No demo assets available."
                  : "Try adjusting your search or filters — same empty state as the workspace."
              }
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all visible assets"
                      checked={
                        filteredAssets.length > 0 &&
                        filteredAssets.every((asset) => selectedAssetIds.has(asset.id))
                      }
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedAssetIds(new Set(filteredAssets.map((asset) => asset.id)));
                        } else {
                          setSelectedAssetIds(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="w-12" />
                  <th>Name</th>
                  <th>Type</th>
                  <th>Asset ID</th>
                  <th className="hidden md:table-cell">Collection</th>
                  <th className="hidden lg:table-cell">Tags</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    draggable
                    className="cursor-grab active:cursor-grabbing"
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
                          setSelectedAssetIds(next);
                        }}
                      />
                    </td>
                    <td>
                      <AssetPreviewThumb asset={asset} />
                    </td>
                    <td className="font-medium text-[var(--text-primary)]">{asset.name}</td>
                    <td className="text-[var(--text-muted)]">{asset.type}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost max-w-[10rem] truncate p-1 font-mono text-[11px] sm:max-w-none"
                        onClick={() => navigator.clipboard.writeText(asset.assetUri)}
                        title="Click to copy"
                      >
                        <IconCopy size={12} className="mr-1 inline shrink-0" />
                        {asset.assetId}
                      </button>
                    </td>
                    <td className="hidden font-mono text-[11px] text-[var(--text-muted)] md:table-cell">
                      {asset.folderPath}
                    </td>
                    <td className="hidden text-[var(--text-muted)] lg:table-cell">
                      {asset.tags.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {asset.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                              style={{ background: "var(--surface-hover)" }}
                            >
                              {tag}
                            </span>
                          ))}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-[11px] text-[var(--text-faint)]">
        Showing {filteredAssets.length} of {assets.length} in{" "}
        <span className="text-[var(--text-muted)]">{activeFolder}</span>
        {search.trim() ? (
          <>
            {" "}
            matching <span className="text-[var(--text-muted)]">&quot;{search.trim()}&quot;</span>
          </>
        ) : null}
        {selectedCount > 0 ? (
          <>
            {" "}
            · <span className="text-[var(--text-muted)]">{selectedCount} selected</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
