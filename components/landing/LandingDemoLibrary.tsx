"use client";

import { useMemo, useState } from "react";
import { LibraryAssetTable } from "@/components/library/LibraryAssetTable";
import { LibraryCollectionsLayout } from "@/components/library/LibraryCollectionsLayout";
import { LibraryFilterBar } from "@/components/library/LibraryFilterBar";
import { LibraryFooterSummary } from "@/components/library/LibraryFooterSummary";
import { LibraryTagsToolbar } from "@/components/library/LibraryTagsToolbar";
import {
  ALL_FOLDERS_OPTION,
  LibraryFolderPanel,
} from "@/components/library/LibraryFolderPanel";
import { LibraryStatusSlot } from "@/components/library/LibraryStatusSlot";
import { IconSearch } from "@/components/ui/Icon";
import { filterDemoLibraryAssets } from "@/lib/demo-library-assets";
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
import {
  DEFAULT_LIBRARY_SORT,
  sortLibraryAssets,
  toggleLibrarySort,
  type LibrarySortColumn,
  type LibrarySortState,
} from "@/lib/library-sort";
import {
  collectUniqueTags,
  mergeTags,
  normalizeTag,
  removeTag,
} from "@/lib/library-tags";
import { normalizeFolderPath } from "@/lib/local-assets-db";
import type { AssetType } from "@/lib/types";

export function LandingDemoLibrary() {
  const [library, setLibrary] = useState(createInitialDemoLibraryState);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const [folderFilter, setFolderFilter] = useState(ALL_FOLDERS_OPTION);
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState<LibrarySortState>(DEFAULT_LIBRARY_SORT);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState(ROOT_FOLDER);
  const [expandedFolderPaths, setExpandedFolderPaths] = useState<Set<string>>(
    () => new Set([ROOT_FOLDER]),
  );
  const [viewVersionByAssetId, setViewVersionByAssetId] = useState<Record<string, string>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

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

    return sortLibraryAssets(next, sort);
  }, [assets, folderFilter, search, sort, tagFilter, typeFilter]);

  const folderPaths = useMemo(() => {
    const unique = new Set<string>(folders);
    assets.forEach((asset) => unique.add(asset.folderPath));
    unique.add(ROOT_FOLDER);
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [assets, folders]);

  const folderTree = useMemo(() => buildFolderTree(folderPaths), [folderPaths]);
  const nestedFolderAssetCounts = useMemo(() => buildNestedAssetCounts(assets), [assets]);
  const libraryTags = useMemo(
    () => collectUniqueTags(assets, { sort: "count" }),
    [assets],
  );
  const selectedCount = selectedAssetIds.size;

  function updateDemoAssetTags(assetId: string, tags: string[]) {
    setLibrary((current) => ({
      ...current,
      assets: current.assets.map((asset) =>
        asset.id === assetId ? { ...asset, tags, updatedAt: Date.now() } : asset,
      ),
    }));
  }

  function addDemoTag(assetId: string, rawTag: string) {
    const tag = normalizeTag(rawTag);
    if (!tag) {
      return;
    }
    const asset = assets.find((entry) => entry.id === assetId);
    if (!asset) {
      return;
    }
    updateDemoAssetTags(assetId, mergeTags(asset.tags, [tag]));
  }

  function removeDemoTag(assetId: string, rawTag: string) {
    const asset = assets.find((entry) => entry.id === assetId);
    if (!asset) {
      return;
    }
    updateDemoAssetTags(assetId, removeTag(asset.tags, rawTag));
  }

  function applyDemoBulkTags(tags: string[]) {
    const normalized = tags.map(normalizeTag).filter(Boolean);
    if (!selectedAssetIds.size || !normalized.length) {
      setStatusMessage("Select assets and enter tags first.");
      return;
    }

    const ids = selectedAssetIds;
    setLibrary((current) => ({
      ...current,
      assets: current.assets.map((asset) =>
        ids.has(asset.id)
          ? { ...asset, tags: mergeTags(asset.tags, normalized), updatedAt: Date.now() }
          : asset,
      ),
    }));
    setStatusMessage(`Tagged ${ids.size} assets.`);
  }

  function removeDemoBulkTag(rawTag: string) {
    const tag = normalizeTag(rawTag);
    if (!selectedAssetIds.size || !tag) {
      setStatusMessage("Select assets and choose a tag to remove.");
      return;
    }

    const ids = selectedAssetIds;
    let changed = 0;
    setLibrary((current) => ({
      ...current,
      assets: current.assets.map((asset) => {
        if (!ids.has(asset.id)) {
          return asset;
        }
        const nextTags = removeTag(asset.tags, tag);
        if (nextTags.length === asset.tags.length) {
          return asset;
        }
        changed += 1;
        return { ...asset, tags: nextTags, updatedAt: Date.now() };
      }),
    }));

    setStatusMessage(
      changed > 0
        ? `Removed "${tag}" from ${changed} assets.`
        : `No selected assets had the tag "${tag}".`,
    );
  }

  function deleteDemoSelected() {
    const ids = selectedAssetIds;
    if (!ids.size) {
      return;
    }
    setLibrary((current) => ({
      ...current,
      assets: current.assets.filter((asset) => !ids.has(asset.id)),
    }));
    setSelectedAssetIds(new Set());
    setStatusMessage(`Removed ${ids.size} assets from the demo library.`);
  }

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
    setSort(DEFAULT_LIBRARY_SORT);
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

  function handleSort(column: LibrarySortColumn) {
    setSort((current) => toggleLibrarySort(current, column));
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
            Full workspace preview — collections, tags, version history, and drag-to-move. Re-upload
            an asset and prior rbxassetids stay in the chain. Changes reset on refresh.
          </p>
          <p className="pt-1 font-mono text-xs text-[var(--text-faint)]">
            {assets.length} assets · {folderPaths.length} folders
          </p>
        </div>
      </div>

      <LibraryFilterBar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        onReset={clearFilters}
        selectedCount={selectedCount}
        selectionActions={
          <button
            type="button"
            className="library-compact-btn btn-secondary"
            onClick={deleteDemoSelected}
          >
            Delete
          </button>
        }
      />

      <div className="mt-1.5">
        <LibraryTagsToolbar
          allTags={libraryTags}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          selectedCount={selectedCount}
          onApplyTags={applyDemoBulkTags}
          onRemoveTagFromSelection={removeDemoBulkTag}
        />
      </div>

      <LibraryStatusSlot message={statusMessage} />

      <LibraryCollectionsLayout
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        sidebar={
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
            collapsible
            onCollapse={() => setSidebarCollapsed(true)}
          />
        }
      >
        <LibraryAssetTable
          assets={filteredAssets}
          sort={sort}
          onSort={handleSort}
          selectedAssetIds={selectedAssetIds}
          onSelectionChange={setSelectedAssetIds}
          viewVersionByAssetId={viewVersionByAssetId}
          onViewVersionChange={(libraryAssetId, rbxAssetId) => {
            setViewVersionByAssetId((current) => ({
              ...current,
              [libraryAssetId]: rbxAssetId,
            }));
          }}
          onTagClick={setTagFilter}
          onAddTag={addDemoTag}
          onRemoveTag={removeDemoTag}
          emptyState={{
            icon: <IconSearch size={18} />,
            title: "No assets found",
            description:
              assets.length === 0
                ? "No demo assets available."
                : "Try adjusting your search or filters — same empty state as the workspace.",
          }}
        />
      </LibraryCollectionsLayout>

      <LibraryFooterSummary
        visibleCount={filteredAssets.length}
        totalCount={assets.length}
        activeFolder={activeFolder}
        search={search}
        selectedCount={selectedCount}
      />
    </div>
  );
}
