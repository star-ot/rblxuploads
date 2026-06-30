"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  bulkUpsertLocalFolders,
  bulkUpsertLocalAssets,
  deleteLocalFolderTree,
  getRootFolderPath,
  listLocalAssets,
  listLocalFolders,
  normalizeFolderPath,
  renameLocalFolderTree,
  removeLocalAssets,
  upsertLocalAsset,
  upsertLocalFolder,
} from "@/lib/local-assets-db";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconFolder,
  IconSearch,
} from "@/components/ui/Icon";
import { canUpdateModelPackage } from "@/lib/file-parser";
import { updateModelPackage } from "@/lib/upload/client";
import type {
  AssetType,
  LocalAssetExportPayload,
  LocalAssetRecord,
  UploadConfig,
  UploadQueueItem,
} from "@/lib/types";

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "type";
const ROOT_FOLDER = getRootFolderPath();
const ALL_FOLDERS_OPTION = "all";

interface FolderTreeNode {
  name: string;
  path: string;
  children: FolderTreeNode[];
}

interface AssetLibraryManagerProps {
  items: UploadQueueItem[];
  config: UploadConfig;
}

export function AssetLibraryManager({ items, config }: AssetLibraryManagerProps) {
  const [assets, setAssets] = useState<LocalAssetRecord[]>([]);
  const [folders, setFolders] = useState<string[]>([ROOT_FOLDER]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AssetType>("all");
  const [folderFilter, setFolderFilter] = useState(ALL_FOLDERS_OPTION);
  const [tagFilter, setTagFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState(ROOT_FOLDER);
  const [newFolderParent, setNewFolderParent] = useState(ROOT_FOLDER);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderPath, setRenameFolderPath] = useState(ROOT_FOLDER);
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [managerStatus, setManagerStatus] = useState("");
  const [targetModelAssetId, setTargetModelAssetId] = useState("");
  const [targetModelName, setTargetModelName] = useState("");
  const [modelUpdateStatus, setModelUpdateStatus] = useState("");
  const [expandedFolderPaths, setExpandedFolderPaths] = useState<Set<string>>(
    () => new Set([ROOT_FOLDER]),
  );
  const modelFileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const persistedUploadIds = useRef(new Set<string>());

  useEffect(() => {
    void refreshLibrary();
  }, []);

  useEffect(() => {
    const newlyCompleted = items.filter(
      (item) =>
        item.status === "complete" &&
        item.assetId &&
        !persistedUploadIds.current.has(item.id),
    );

    if (!newlyCompleted.length) {
      return;
    }

    void (async () => {
      for (const item of newlyCompleted) {
        persistedUploadIds.current.add(item.id);
        const thumbnailDataUrl =
          item.assetType === "Image"
            ? await createImageThumbnailDataUrl(item.file)
            : undefined;
        await upsertLocalAsset({
          id: crypto.randomUUID(),
          name: item.assetName,
          type: item.assetType,
          assetId: item.assetId ?? "",
          assetUri: `rbxassetid://${item.assetId}`,
          thumbnailDataUrl,
          fileName: item.fileName,
          folderPath: ROOT_FOLDER,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      await refreshLibrary();
    })();
  }, [items]);

  const filteredAssets = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const tagText = tagFilter.trim().toLowerCase();

    const next = assets.filter((asset) => {
      if (typeFilter !== "all" && asset.type !== typeFilter) {
        return false;
      }
      if (
        folderFilter !== ALL_FOLDERS_OPTION &&
        asset.folderPath !== folderFilter &&
        !asset.folderPath.startsWith(`${folderFilter}/`)
      ) {
        return false;
      }
      if (
        tagText &&
        !asset.tags.some((tag) => tag.toLowerCase().includes(tagText))
      ) {
        return false;
      }
      if (!searchText) {
        return true;
      }

      const haystack = [
        asset.name,
        asset.assetId,
        asset.assetUri,
        asset.fileName,
        asset.folderPath,
        asset.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchText);
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

  const nestedFolderAssetCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const asset of assets) {
      for (const ancestor of getFolderAncestors(asset.folderPath)) {
        counts.set(ancestor, (counts.get(ancestor) ?? 0) + 1);
      }
    }
    return counts;
  }, [assets]);

  async function refreshLibrary() {
    const [nextAssets, nextFolders] = await Promise.all([
      listLocalAssets(),
      listLocalFolders(),
    ]);
    setAssets(nextAssets);
    setFolders(nextFolders);
  }

  async function createFolder(parentOverride?: string) {
    if (!newFolderName.trim()) {
      setManagerStatus("Enter a folder name first.");
      return;
    }

    const hasOverride = parentOverride !== undefined;
    const parent = hasOverride ? parentOverride : newFolderParent;
    const normalized = normalizeFolderPath(
      parent.trim() ? `${parent}/${newFolderName}` : newFolderName,
    );
    await upsertLocalFolder(normalized);
    setNewFolderName("");
    setSelectedFolder(normalized);
    setRenameFolderPath(normalized);
    setFolderFilter(normalized);
    setExpandedFolderPaths((current) => {
      const next = new Set(current);
      for (const ancestor of getFolderAncestors(normalized)) {
        next.add(ancestor);
      }
      return next;
    });
    await refreshLibrary();
    setManagerStatus(`Folder ready: ${normalized}`);
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
    setNewFolderParent(folderPath);
    setRenameFolderPath(folderPath);
    setExpandedFolderPaths((current) => {
      const next = new Set(current);
      for (const ancestor of getFolderAncestors(folderPath)) {
        next.add(ancestor);
      }
      return next;
    });
  }

  async function renameSelectedFolder() {
    const source = normalizeFolderPath(selectedFolder);
    const target = normalizeFolderPath(renameFolderPath);

    if (source === ROOT_FOLDER) {
      setManagerStatus("Select a subfolder to rename.");
      return;
    }
    if (!renameFolderPath.trim()) {
      setManagerStatus("Enter a target folder path first.");
      return;
    }
    if (source === target) {
      setManagerStatus("Folder path did not change.");
      return;
    }

    try {
      const result = await renameLocalFolderTree(source, target);
      await refreshLibrary();
      setSelectedFolder(target);
      setFolderFilter(target);
      setRenameFolderPath(target);
      setExpandedFolderPaths((current) => {
        const next = new Set(current);
        for (const ancestor of getFolderAncestors(target)) {
          next.add(ancestor);
        }
        return next;
      });
      setManagerStatus(
        `Renamed ${result.renamedFolders} folders and moved ${result.movedAssets} assets to ${target}.`,
      );
    } catch (error) {
      setManagerStatus(error instanceof Error ? error.message : "Folder rename failed.");
    }
  }

  async function deleteSelectedFolder() {
    const target = normalizeFolderPath(selectedFolder);
    if (target === ROOT_FOLDER) {
      setManagerStatus("Root folder cannot be deleted.");
      return;
    }

    try {
      const result = await deleteLocalFolderTree(target);
      await refreshLibrary();
      setSelectedFolder(ROOT_FOLDER);
      setRenameFolderPath(ROOT_FOLDER);
      setFolderFilter(ALL_FOLDERS_OPTION);
      setManagerStatus(
        `Deleted ${result.deletedFolders} folders. Moved ${result.movedAssets} assets to ${result.movedTo}.`,
      );
    } catch (error) {
      setManagerStatus(error instanceof Error ? error.message : "Folder delete failed.");
    }
  }

  function clearFilters() {
    setSearch("");
    setTagFilter("");
    setTypeFilter("all");
    setSortKey("newest");
    setFolderFilter(ALL_FOLDERS_OPTION);
    setSelectedFolder(ROOT_FOLDER);
    setRenameFolderPath(ROOT_FOLDER);
  }

  async function moveSelected() {
    if (!selectedAssetIds.size) {
      setManagerStatus("Select assets to move first.");
      return;
    }

    const ids = selectedAssetIds;
    const updates = assets
      .filter((asset) => ids.has(asset.id))
      .map((asset) => ({
        ...asset,
        folderPath: selectedFolder,
        updatedAt: Date.now(),
      }));
    await bulkUpsertLocalAssets(updates);
    setSelectedAssetIds(new Set());
    setManagerStatus(`Moved ${updates.length} assets to ${selectedFolder}.`);
    await refreshLibrary();
  }

  async function applyBulkTags() {
    const tags = bulkTagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!selectedAssetIds.size || !tags.length) {
      setManagerStatus("Select assets and enter tags first.");
      return;
    }

    const ids = selectedAssetIds;
    const updates = assets
      .filter((asset) => ids.has(asset.id))
      .map((asset) => ({
        ...asset,
        tags: Array.from(new Set([...asset.tags, ...tags])),
        updatedAt: Date.now(),
      }));
    await bulkUpsertLocalAssets(updates);
    setBulkTagInput("");
    setManagerStatus(`Tagged ${updates.length} assets.`);
    await refreshLibrary();
  }

  async function deleteSelected() {
    const ids = Array.from(selectedAssetIds);
    if (!ids.length) {
      return;
    }
    await removeLocalAssets(ids);
    setSelectedAssetIds(new Set());
    setManagerStatus(`Deleted ${ids.length} assets from local library.`);
    await refreshLibrary();
  }

  function exportAssets(
    selected: LocalAssetRecord[],
    selectedFolders: string[],
    format: "json" | "csv",
    label: string,
  ) {
    const payload: LocalAssetExportPayload = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      folders: selectedFolders,
      assets: selected,
    };

    let blob: Blob;
    let extension = "json";
    let mime = "application/json";

    if (format === "csv") {
      const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
      const rows = [
        [
          "id",
          "name",
          "type",
          "assetId",
          "assetUri",
          "thumbnailDataUrl",
          "fileName",
          "folderPath",
          "tags",
          "createdAt",
          "updatedAt",
        ],
        ...selected.map((asset) => [
          asset.id,
          asset.name,
          asset.type,
          asset.assetId,
          asset.assetUri,
          asset.thumbnailDataUrl ?? "",
          asset.fileName,
          asset.folderPath,
          asset.tags.join("|"),
          String(asset.createdAt),
          String(asset.updatedAt),
        ]),
      ];
      blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], {
        type: "text/csv;charset=utf-8",
      });
      extension = "csv";
      mime = "text/csv";
    } else {
      blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rblxuploads-library-${Date.now()}.${extension}`;
    anchor.type = mime;
    anchor.click();
    URL.revokeObjectURL(url);
    setManagerStatus(
      `Exported ${selected.length} ${label} as ${format.toUpperCase()}.`,
    );
  }

  function exportSelection(format: "json" | "csv") {
    const selected = assets.filter((asset) => selectedAssetIds.has(asset.id));
    if (!selected.length) {
      setManagerStatus("Select at least one asset to export.");
      return;
    }
    const selectedFolders = getFoldersFromAssets(selected);
    exportAssets(selected, selectedFolders, format, "assets");
  }

  function exportFolderSelection(format: "json" | "csv") {
    const scopedFolders = getFolderSubtree(selectedFolder, folderPaths);
    const scopedAssets = assets.filter(
      (asset) =>
        asset.folderPath === selectedFolder ||
        asset.folderPath.startsWith(`${selectedFolder}/`),
    );
    if (!scopedAssets.length && !scopedFolders.length) {
      setManagerStatus(`No folders or assets in ${selectedFolder} to export.`);
      return;
    }
    exportAssets(scopedAssets, scopedFolders, format, `content from ${selectedFolder}`);
  }

  async function importLibrary(file: File) {
    try {
      const text = await file.text();
      const parsedImport = file.name.toLowerCase().endsWith(".csv")
        ? { assets: parseCsvImport(text), folders: [] as string[] }
        : parseJsonImport(text);
      const imported = parsedImport.assets;
      const importedFolders = parsedImport.folders;

      const normalized = imported
        .filter((asset): asset is Partial<LocalAssetRecord> & { name: string; assetId: string } =>
          Boolean(asset.name && asset.assetId),
        )
        .map((asset) => ({
          // Imports are additive only: always allocate a fresh local record id
          // so existing library entries are never overwritten.
          id: crypto.randomUUID(),
          name: asset.name,
          type: normalizeImportedType(asset.type),
          assetId: asset.assetId,
          assetUri: asset.assetUri || `rbxassetid://${asset.assetId}`,
          thumbnailDataUrl:
            typeof asset.thumbnailDataUrl === "string" ? asset.thumbnailDataUrl : undefined,
          folderPath: normalizeFolderPath(asset.folderPath || ROOT_FOLDER),
          tags: asset.tags ?? [],
          fileName: asset.fileName ?? `${asset.name}.asset`,
          createdAt: asset.createdAt || Date.now(),
          updatedAt: Date.now(),
        }));

      if (!normalized.length && !importedFolders.length) {
        setManagerStatus("No importable folders or assets were found in the selected file.");
        return;
      }

      if (importedFolders.length) {
        await bulkUpsertLocalFolders(importedFolders);
      }
      await bulkUpsertLocalAssets(normalized);
      await refreshLibrary();
      setManagerStatus(
        `Imported ${normalized.length} assets and ${importedFolders.length} folders from ${file.name}.`,
      );
    } catch {
      setManagerStatus(
        "Import failed. Use a JSON export payload or CSV with matching columns.",
      );
    }
  }

  async function runModelUpdate() {
    const file = modelFileRef.current?.files?.[0];
    if (!file) {
      setModelUpdateStatus("Choose an FBX file to update a package.");
      return;
    }
    if (!/^\d+$/.test(targetModelAssetId.trim())) {
      setModelUpdateStatus("Target model asset ID must be numeric.");
      return;
    }
    if (!canUpdateModelPackage(file)) {
      setModelUpdateStatus("Only FBX files are supported for model package updates.");
      return;
    }
    if (!config.apiKey.trim()) {
      setModelUpdateStatus("Add your API key in Credentials first.");
      return;
    }

    setModelUpdateStatus("Updating model package…");
    const response = await updateModelPackage({
      file,
      assetId: targetModelAssetId.trim(),
      displayName: targetModelName.trim() || file.name,
      config,
    });

    if (!response.ok || !response.assetId) {
      setModelUpdateStatus(response.error ?? "Model package update failed.");
      return;
    }

    await upsertLocalAsset({
      id: crypto.randomUUID(),
      name: targetModelName.trim() || file.name,
      type: "Model",
      assetId: response.assetId,
      assetUri: `rbxassetid://${response.assetId}`,
      fileName: file.name,
      folderPath: ROOT_FOLDER,
      tags: ["updated-package"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await refreshLibrary();
    setTargetModelName("");
    setModelUpdateStatus(`Model package updated for asset ${response.assetId}.`);
    if (modelFileRef.current) {
      modelFileRef.current.value = "";
    }
  }

  const selectedCount = selectedAssetIds.size;

  return (
    <section className="panel">
      <SectionHeader
        title="Asset library"
        description="Your local collection. Folders, tags, search, and portable export — stored in IndexedDB on your machine."
        meta={`${assets.length} assets · ${folders.length} folders`}
      />

      <div className="grid gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <IconSearch
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
          />
          <input
            className="field-input pl-9"
            placeholder="Search name, ID, folder, tags…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search assets"
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
            onChange={(event) => setTypeFilter(event.target.value as "all" | AssetType)}
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

      <div className="mt-3 grid gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-1 md:col-span-2 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="label">New collection</p>
            <p className="font-mono text-[11px] text-[var(--text-faint)]">
              {normalizeFolderPath(`${newFolderParent}/${newFolderName || "…"}`)}
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
            <select
              className="field-input"
              value={newFolderParent}
              onChange={(event) => setNewFolderParent(event.target.value)}
            >
              {folderPaths.map((folder) => (
                <option key={folder} value={folder}>
                  Parent: {folder}
                </option>
              ))}
            </select>
            <input
              className="field-input"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
            />
            <button type="button" className="btn-secondary" onClick={() => createFolder()}>
              Create folder
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => createFolder("")}
            >
              At root
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="field-input"
            placeholder="Rename selected folder path"
            value={renameFolderPath}
            onChange={(event) => setRenameFolderPath(event.target.value)}
            disabled={selectedFolder === ROOT_FOLDER}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={renameSelectedFolder}
            disabled={selectedFolder === ROOT_FOLDER}
          >
            Rename
          </button>
        </div>
        <select
          className="field-input"
          value={selectedFolder}
          onChange={(event) => selectFolder(event.target.value)}
        >
          {folderPaths.map((folder) => (
            <option key={folder} value={folder}>
              Move target: {folder}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            className="field-input"
            placeholder="Bulk tags (comma separated)"
            value={bulkTagInput}
            onChange={(event) => setBulkTagInput(event.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={applyBulkTags}>
            Tag
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3 md:grid-cols-2 xl:grid-cols-4">
        <button type="button" className="btn-secondary" onClick={moveSelected}>
          Move selected ({selectedCount})
        </button>
        <button type="button" className="btn-secondary" onClick={() => exportSelection("json")}>
          Export selected JSON
        </button>
        <button type="button" className="btn-secondary" onClick={() => exportSelection("csv")}>
          Export selected CSV
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => exportFolderSelection("json")}
        >
          Export folder JSON
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => exportFolderSelection("csv")}
        >
          Export folder CSV
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => importRef.current?.click()}
        >
          Import JSON/CSV
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={deleteSelectedFolder}
          disabled={selectedFolder === ROOT_FOLDER}
        >
          Delete folder subtree
        </button>
        <button type="button" className="btn-secondary" onClick={deleteSelected}>
          Delete selected
        </button>
      </div>
      {managerStatus ? (
        <p className="alert alert-info mt-3 text-[13px]" role="status">{managerStatus}</p>
      ) : null}

      <input
        ref={importRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void importLibrary(file);
          }
          event.target.value = "";
        }}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <aside className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-2">
          <p className="label px-2 pb-2">Collections</p>
          <button
            type="button"
            className={`mb-1 flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors ${
              folderFilter === ALL_FOLDERS_OPTION
                ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
            onClick={() => setFolderFilter(ALL_FOLDERS_OPTION)}
          >
            <span className="flex items-center gap-2">
              <IconFolder size={14} className="shrink-0 opacity-60" />
              All assets
            </span>
            <span className="font-mono text-[11px] text-[var(--text-faint)]">{assets.length}</span>
          </button>
          <div className="max-h-[24rem] overflow-y-auto pr-1">
            {folderTree.map((node) => (
              <FolderTreeItem
                key={node.path}
                node={node}
                depth={0}
                selectedFolder={folderFilter}
                expandedPaths={expandedFolderPaths}
                nestedAssetCounts={nestedFolderAssetCounts}
                onSelect={selectFolder}
                onToggleExpand={toggleFolderExpansion}
              />
            ))}
          </div>
        </aside>

        <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
          {filteredAssets.length === 0 ? (
            <EmptyState
              icon={<IconFolder size={18} />}
              title="No assets found"
              description={
                assets.length === 0
                  ? "Completed uploads are saved here automatically. Upload assets to get started."
                  : "Try adjusting your search or filters."
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
                  <tr key={asset.id}>
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
                      {asset.thumbnailDataUrl ? (
                        <img
                          src={asset.thumbnailDataUrl}
                          alt=""
                          className="h-8 w-8 rounded border border-[var(--border-subtle)] object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--surface-inset)] text-[10px] font-medium text-[var(--text-muted)]">
                          {getAssetTypeGlyph(asset.type)}
                        </div>
                      )}
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

      <div className="mt-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-4">
        <h3 className="font-display text-[15px] font-medium text-[var(--text-primary)]">
          Update model package
        </h3>
        <p className="mt-1 caption">
          Replace the content of an existing model asset via Open Cloud. FBX only.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <input
            className="field-input font-mono"
            placeholder="Target model asset ID"
            value={targetModelAssetId}
            onChange={(event) => setTargetModelAssetId(event.target.value)}
          />
          <input
            className="field-input"
            placeholder="Display name (optional)"
            value={targetModelName}
            onChange={(event) => setTargetModelName(event.target.value)}
          />
          <input ref={modelFileRef} type="file" accept=".fbx,model/fbx" className="field-input" />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={runModelUpdate}>
            Update package
          </button>
        </div>
        {modelUpdateStatus ? (
          <p className="alert alert-info mt-3 text-[13px]" role="status">{modelUpdateStatus}</p>
        ) : null}
      </div>
    </section>
  );
}

interface FolderTreeItemProps {
  node: FolderTreeNode;
  depth: number;
  selectedFolder: string;
  expandedPaths: Set<string>;
  nestedAssetCounts: Map<string, number>;
  onSelect: (folderPath: string) => void;
  onToggleExpand: (folderPath: string) => void;
}

function FolderTreeItem({
  node,
  depth,
  selectedFolder,
  expandedPaths,
  nestedAssetCounts,
  onSelect,
  onToggleExpand,
}: FolderTreeItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedPaths.has(node.path);
  const isSelected =
    selectedFolder === node.path || selectedFolder.startsWith(`${node.path}/`);

  return (
    <div>
      <div
        className={`mb-0.5 flex items-center gap-0.5 rounded-md pr-1 ${
          isSelected
            ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        }`}
      >
        <button
          type="button"
          className={`flex h-7 w-6 shrink-0 items-center justify-center ${hasChildren ? "text-[var(--text-muted)]" : "opacity-0"}`}
          onClick={() => {
            if (hasChildren) {
              onToggleExpand(node.path);
            }
          }}
          aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
        >
          {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </button>
        <button
          type="button"
          className="flex min-h-7 flex-1 items-center justify-between gap-2 rounded py-1.5 text-left text-[13px]"
          style={{ paddingLeft: `${depth * 0.5}rem` }}
          onClick={() => onSelect(node.path)}
        >
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <IconFolder size={13} className="shrink-0 opacity-50" />
            {node.name}
          </span>
          <span className="shrink-0 font-mono text-[10px] text-[var(--text-faint)]">
            {nestedAssetCounts.get(node.path) ?? 0}
          </span>
        </button>
      </div>
      {hasChildren && isExpanded ? (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFolder={selectedFolder}
              expandedPaths={expandedPaths}
              nestedAssetCounts={nestedAssetCounts}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildFolderTree(folderPaths: string[]): FolderTreeNode[] {
  const byPath = new Map<string, FolderTreeNode>();

  const getOrCreate = (path: string): FolderTreeNode => {
    const existing = byPath.get(path);
    if (existing) {
      return existing;
    }
    const segments = path.split("/");
    const node: FolderTreeNode = {
      name: segments[segments.length - 1] || ROOT_FOLDER,
      path,
      children: [],
    };
    byPath.set(path, node);
    return node;
  };

  for (const path of folderPaths) {
    const normalized = normalizeFolderPath(path);
    const parts = normalized.split("/");
    let current = parts[0];
    getOrCreate(current);

    for (let i = 1; i < parts.length; i += 1) {
      const parent = current;
      current = `${current}/${parts[i]}`;
      const parentNode = getOrCreate(parent);
      const currentNode = getOrCreate(current);
      if (!parentNode.children.some((child) => child.path === currentNode.path)) {
        parentNode.children.push(currentNode);
      }
    }
  }

  const sortChildren = (node: FolderTreeNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortChildren);
  };

  const roots = Array.from(byPath.values())
    .filter((node) => !node.path.includes("/"))
    .sort((a, b) => a.name.localeCompare(b.name));

  roots.forEach(sortChildren);
  return roots;
}

function getFolderAncestors(folderPath: string): string[] {
  const normalized = normalizeFolderPath(folderPath);
  const parts = normalized.split("/");
  const ancestors: string[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    ancestors.push(parts.slice(0, i + 1).join("/"));
  }
  return ancestors;
}

function parseJsonImport(text: string): {
  assets: Partial<LocalAssetRecord>[];
  folders: string[];
} {
  const parsed = JSON.parse(text) as
    | LocalAssetExportPayload
    | Array<Partial<LocalAssetRecord>>;
  if (Array.isArray(parsed)) {
    return {
      assets: parsed,
      folders: [],
    };
  }
  return {
    assets: Array.isArray(parsed.assets) ? parsed.assets : [],
    folders: Array.isArray(parsed.folders)
      ? parsed.folders.map((folder) => normalizeFolderPath(String(folder)))
      : [],
  };
}

function normalizeImportedType(type: string | undefined): AssetType {
  if (type === "Audio" || type === "Model" || type === "Image" || type === "Mesh") {
    return type;
  }
  return "Image";
}

function parseCsvImport(text: string): Partial<LocalAssetRecord>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return [];
  }
  const headers = splitCsvLine(lines[0]);
  const rows: Partial<LocalAssetRecord>[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const get = (key: string) => cells[headers.indexOf(key)] ?? "";
    const name = get("name");
    const assetId = get("assetId");
    if (!name || !assetId) {
      continue;
    }

    rows.push({
      id: get("id"),
      name,
      type: (get("type") || "Image") as AssetType,
      assetId,
      assetUri: get("assetUri"),
      thumbnailDataUrl: get("thumbnailDataUrl") || undefined,
      fileName: get("fileName"),
      folderPath: get("folderPath"),
      tags: get("tags")
        .split("|")
        .map((tag) => tag.trim())
        .filter(Boolean),
      createdAt: Number(get("createdAt")) || Date.now(),
      updatedAt: Number(get("updatedAt")) || Date.now(),
    });
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);

  return result;
}

function getAssetTypeGlyph(type: AssetType): string {
  switch (type) {
    case "Audio":
      return "A";
    case "Model":
      return "M";
    case "Mesh":
      return "X";
    case "Image":
    default:
      return "I";
  }
}

function getFoldersFromAssets(records: LocalAssetRecord[]): string[] {
  const unique = new Set<string>([ROOT_FOLDER]);
  for (const asset of records) {
    for (const ancestor of getFolderAncestors(asset.folderPath)) {
      unique.add(ancestor);
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

function getFolderSubtree(rootFolder: string, allFolders: string[]): string[] {
  const root = normalizeFolderPath(rootFolder);
  const scoped = allFolders.filter(
    (folder) => folder === root || folder.startsWith(`${root}/`),
  );
  return Array.from(new Set(scoped)).sort((a, b) => a.localeCompare(b));
}

async function createImageThumbnailDataUrl(file: File): Promise<string | undefined> {
  if (!file.type.startsWith("image/")) {
    return undefined;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    if (!Number.isFinite(longestSide) || longestSide <= 0) {
      return undefined;
    }

    const maxDimension = 160;
    const scale = Math.min(1, maxDimension / longestSide);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/webp", 0.82);
  } catch {
    return undefined;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed reading file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed loading image."));
    image.src = src;
  });
}
