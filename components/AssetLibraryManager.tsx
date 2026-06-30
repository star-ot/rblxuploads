"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  bulkUpsertLocalFolders,
  bulkUpsertLocalAssets,
  deleteLocalFolderTree,
  listLocalAssets,
  listLocalFolders,
  normalizeFolderPath,
  renameLocalFolderTree,
  removeLocalAssets,
  upsertLocalAsset,
  upsertLocalFolder,
} from "@/lib/local-assets-db";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LibraryAssetTable } from "@/components/library/LibraryAssetTable";
import { LibraryActionsBar } from "@/components/library/LibraryActionsBar";
import { LibraryCollectionsLayout } from "@/components/library/LibraryCollectionsLayout";
import { LibraryFilterBar } from "@/components/library/LibraryFilterBar";
import { LibraryTagsToolbar } from "@/components/library/LibraryTagsToolbar";
import {
  ALL_FOLDERS_OPTION,
  LibraryFolderPanel,
} from "@/components/library/LibraryFolderPanel";
import { InsertServiceScriptTrigger } from "@/components/library/InsertServiceScriptGenerator";
import { LibraryStatusSlot } from "@/components/library/LibraryStatusSlot";
import { getAssetTypeGlyph } from "@/lib/library/asset-glyphs";
import {
  IconFolder,
} from "@/components/ui/Icon";
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
import {
  type InsertScriptAsset,
  isInsertableStudioAsset,
} from "@/lib/insert-service-script";
import {
  buildFolderTree,
  buildNestedAssetCounts,
  computeRenamedFolderPath,
  computeReparentedFolderPath,
  getFolderAncestors,
  joinFolderPath,
  ROOT_FOLDER,
} from "@/lib/folder-tree";
import { LibrarySyncModal } from "@/components/library/LibrarySyncModal";
import { normalizeImportedAssets, parseLibraryImport } from "@/lib/library/import";
import { serializeCompactExport, toCompactExport } from "@/lib/library/export";
import { createOptimizedPreview } from "@/lib/library/preview";
import {
  normalizeAssetVersions,
  replaceAssetVersion,
} from "@/lib/library/versioning";
import { canUpdateModelPackage } from "@/lib/file-parser";
import { validateActiveProfile } from "@/lib/config/credentials";
import { updateModelPackage } from "@/lib/upload/client";
import type {
  AssetType,
  LocalAssetExportPayload,
  LocalAssetRecord,
  UploadConfig,
  UploadQueueItem,
} from "@/lib/types";

interface AssetLibraryManagerProps {
  items: UploadQueueItem[];
  config: UploadConfig;
  onNotify?: (message: string, tone?: "info" | "success" | "error") => void;
  onQueueVersionUpload?: (payload: {
    libraryAssetId: string;
    file: File;
    assetName: string;
  }) => void;
}

export function AssetLibraryManager({
  items,
  config,
  onNotify,
  onQueueVersionUpload,
}: AssetLibraryManagerProps) {
  const [assets, setAssets] = useState<LocalAssetRecord[]>([]);
  const [folders, setFolders] = useState<string[]>([ROOT_FOLDER]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [syncOpen, setSyncOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AssetType>("all");
  const [folderFilter, setFolderFilter] = useState(ALL_FOLDERS_OPTION);
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState<LibrarySortState>(DEFAULT_LIBRARY_SORT);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState(ROOT_FOLDER);
  const [managerStatus, setManagerStatus] = useState("");
  const [targetModelAssetId, setTargetModelAssetId] = useState("");
  const [targetModelName, setTargetModelName] = useState("");
  const [modelUpdateStatus, setModelUpdateStatus] = useState("");
  const [expandedFolderPaths, setExpandedFolderPaths] = useState<Set<string>>(
    () => new Set([ROOT_FOLDER]),
  );
  const modelFileRef = useRef<HTMLInputElement>(null);
  const versionFileRef = useRef<HTMLInputElement>(null);
  const versionTargetRef = useRef<LocalAssetRecord | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const persistedUploadIds = useRef(new Set<string>());
  const [viewVersionByAssetId, setViewVersionByAssetId] = useState<Record<string, string>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      const libraryById = new Map(
        (await listLocalAssets()).map((asset) => [
          asset.id,
          normalizeAssetVersions(asset),
        ]),
      );
      const resetVersionViewFor: string[] = [];

      for (const item of newlyCompleted) {
        persistedUploadIds.current.add(item.id);
        const thumbnailDataUrl =
          item.assetType === "Image"
            ? await createOptimizedPreview(item.file)
            : undefined;

        const replaceTarget = item.replaceLibraryAssetId
          ? libraryById.get(item.replaceLibraryAssetId)
          : undefined;

        if (replaceTarget && item.assetId) {
          const updated = replaceAssetVersion(replaceTarget, {
            assetId: item.assetId,
            fileName: item.fileName,
            name: item.assetName,
            thumbnailDataUrl,
          });
          await upsertLocalAsset(updated);
          libraryById.set(updated.id, updated);
          resetVersionViewFor.push(updated.id);
          continue;
        }

        await upsertLocalAsset(
          normalizeAssetVersions({
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
            versions: [],
          }),
        );
      }

      if (resetVersionViewFor.length) {
        setViewVersionByAssetId((current) => {
          const next = { ...current };
          for (const assetId of resetVersionViewFor) {
            delete next[assetId];
          }
          return next;
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

  async function refreshLibrary() {
    const [nextAssets, nextFolders] = await Promise.all([
      listLocalAssets(),
      listLocalFolders(),
    ]);
    setAssets(nextAssets.map((asset) => normalizeAssetVersions(asset)));
    setFolders(nextFolders);
    setLibraryLoading(false);
  }

  function notify(message: string, tone: "info" | "success" | "error" = "info") {
    setManagerStatus(message);
    onNotify?.(message, tone);
  }

  async function persistAssetTags(assetId: string, tags: string[]) {
    const asset = assets.find((entry) => entry.id === assetId);
    if (!asset) {
      return;
    }

    const updated: LocalAssetRecord = {
      ...asset,
      tags,
      updatedAt: Date.now(),
    };

    await upsertLocalAsset(updated);
    setAssets((current) =>
      current.map((entry) => (entry.id === assetId ? updated : entry)),
    );
  }

  async function addTagToAsset(assetId: string, rawTag: string) {
    const tag = normalizeTag(rawTag);
    if (!tag) {
      return;
    }

    const asset = assets.find((entry) => entry.id === assetId);
    if (!asset) {
      return;
    }

    await persistAssetTags(assetId, mergeTags(asset.tags, [tag]));
  }

  async function removeTagFromAsset(assetId: string, rawTag: string) {
    const asset = assets.find((entry) => entry.id === assetId);
    if (!asset) {
      return;
    }

    await persistAssetTags(assetId, removeTag(asset.tags, rawTag));
  }

  async function createFolder(parentPath: string, name: string) {
    if (!name.trim()) {
      setManagerStatus("Enter a folder name first.");
      return;
    }

    const normalized = joinFolderPath(parentPath, name);
    await upsertLocalFolder(normalized);
    setSelectedFolder(normalized);
    setFolderFilter(normalized);
    setExpandedFolderPaths((current) => {
      const next = new Set(current);
      for (const ancestor of getFolderAncestors(normalized)) {
        next.add(ancestor);
      }
      return next;
    });
    await refreshLibrary();
    setManagerStatus(`Created folder: ${normalized}`);
  }

  async function renameFolder(folderPath: string, newName: string) {
    const source = normalizeFolderPath(folderPath);
    const target = computeRenamedFolderPath(source, newName);

    if (source === ROOT_FOLDER) {
      setManagerStatus("The root folder cannot be renamed.");
      return;
    }
    if (source === target) {
      return;
    }

    try {
      const result = await renameLocalFolderTree(source, target);
      await refreshLibrary();
      setSelectedFolder(target);
      setFolderFilter(target);
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

  async function reparentFolder(folderPath: string, newParentPath: string) {
    const source = normalizeFolderPath(folderPath);
    const target = computeReparentedFolderPath(source, newParentPath);

    if (source === ROOT_FOLDER) {
      setManagerStatus("The root folder cannot be moved.");
      return;
    }
    if (source === target) {
      setManagerStatus("Folder is already in that location.");
      return;
    }

    try {
      const result = await renameLocalFolderTree(source, target);
      await refreshLibrary();
      setSelectedFolder(target);
      setFolderFilter(target);
      setExpandedFolderPaths((current) => {
        const next = new Set(current);
        for (const ancestor of getFolderAncestors(target)) {
          next.add(ancestor);
        }
        return next;
      });
      setManagerStatus(
        `Moved folder tree (${result.renamedFolders} folders, ${result.movedAssets} assets) to ${target}.`,
      );
    } catch (error) {
      setManagerStatus(error instanceof Error ? error.message : "Folder move failed.");
    }
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
    setExpandedFolderPaths((current) => {
      const next = new Set(current);
      for (const ancestor of getFolderAncestors(folderPath)) {
        next.add(ancestor);
      }
      return next;
    });
  }

  function selectAllAssets() {
    setFolderFilter(ALL_FOLDERS_OPTION);
    setSelectedFolder(ROOT_FOLDER);
  }
  async function deleteFolder(folderPath: string) {
    const target = normalizeFolderPath(folderPath);
    if (target === ROOT_FOLDER) {
      setManagerStatus("Root folder cannot be deleted.");
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
      const result = await deleteLocalFolderTree(target);
      await refreshLibrary();
      setSelectedFolder(ROOT_FOLDER);
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
    setSort(DEFAULT_LIBRARY_SORT);
    setFolderFilter(ALL_FOLDERS_OPTION);
    setSelectedFolder(ROOT_FOLDER);
  }

  async function moveAssetsToFolder(folderPath: string, assetIds?: string[]) {
    const ids = assetIds ?? Array.from(selectedAssetIds);
    if (!ids.length) {
      setManagerStatus("Select assets to move first.");
      return;
    }

    const idSet = new Set(ids);
    const updates = assets
      .filter((asset) => idSet.has(asset.id))
      .map((asset) => ({
        ...asset,
        folderPath: normalizeFolderPath(folderPath),
        updatedAt: Date.now(),
      }));

    if (!updates.length) {
      return;
    }

    await bulkUpsertLocalAssets(updates);
    setSelectedAssetIds(new Set());
    setManagerStatus(`Moved ${updates.length} assets to ${normalizeFolderPath(folderPath)}.`);
    await refreshLibrary();
  }

  async function applyBulkTags(tags: string[]) {
    const normalized = tags.map(normalizeTag).filter(Boolean);
    if (!selectedAssetIds.size || !normalized.length) {
      setManagerStatus("Select assets and enter tags first.");
      return;
    }

    const ids = selectedAssetIds;
    const updates = assets
      .filter((asset) => ids.has(asset.id))
      .map((asset) => ({
        ...asset,
        tags: mergeTags(asset.tags, normalized),
        updatedAt: Date.now(),
      }));
    await bulkUpsertLocalAssets(updates);
    setAssets((current) => {
      const updateMap = new Map(updates.map((asset) => [asset.id, asset]));
      return current.map((asset) => updateMap.get(asset.id) ?? asset);
    });
    setManagerStatus(`Tagged ${updates.length} assets.`);
  }

  async function removeBulkTagFromSelection(rawTag: string) {
    const tag = normalizeTag(rawTag);
    if (!selectedAssetIds.size || !tag) {
      setManagerStatus("Select assets and choose a tag to remove.");
      return;
    }

    const ids = selectedAssetIds;
    const updates = assets
      .filter((asset) => ids.has(asset.id))
      .map((asset) => ({
        ...asset,
        tags: removeTag(asset.tags, tag),
        updatedAt: Date.now(),
      }))
      .filter((asset, index, list) => {
        const original = assets.find((entry) => entry.id === list[index].id);
        return original ? original.tags.length !== asset.tags.length : false;
      });

    if (!updates.length) {
      setManagerStatus(`No selected assets had the tag "${tag}".`);
      return;
    }

    await bulkUpsertLocalAssets(updates);
    setAssets((current) => {
      const updateMap = new Map(updates.map((asset) => [asset.id, asset]));
      return current.map((asset) => updateMap.get(asset.id) ?? asset);
    });
    setManagerStatus(`Removed "${tag}" from ${updates.length} assets.`);
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
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      folders: selectedFolders,
      assets: selected.map((asset) => normalizeAssetVersions(asset)),
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

  function exportCompactSelection() {
    const selected = assets.filter((asset) => selectedAssetIds.has(asset.id));
    if (!selected.length) {
      setManagerStatus("Select at least one asset to export.");
      return;
    }
    const payload = toCompactExport(selected, getFoldersFromAssets(selected));
    const blob = new Blob([serializeCompactExport(payload)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `studio-vault-compact-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setManagerStatus(
      `Exported ${selected.length} assets as compact JSON (${Math.round(blob.size / 1024)} KB).`,
    );
  }

  function queueNewVersion(asset: LocalAssetRecord) {
    versionTargetRef.current = asset;
    versionFileRef.current?.click();
  }

  function handleVersionFileSelected(file: File | undefined) {
    const target = versionTargetRef.current;
    versionTargetRef.current = null;
    if (!file || !target) {
      return;
    }
    onQueueVersionUpload?.({
      libraryAssetId: target.id,
      file,
      assetName: target.name,
    });
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
        : parseLibraryImport(text);
      const imported = parsedImport.assets;
      const importedFolders = parsedImport.folders;

      const normalized = normalizeImportedAssets(imported);

      if (!normalized.length && !importedFolders.length) {
        notify("No importable folders or assets were found in the selected file.");
        return;
      }

      if (importedFolders.length) {
        await bulkUpsertLocalFolders(importedFolders);
      }
      await bulkUpsertLocalAssets(normalized);
      await refreshLibrary();
      notify(
        `Imported ${normalized.length} assets and ${importedFolders.length} folders from ${file.name}.`,
        "success",
      );
    } catch {
      notify(
        "Import failed. Use a JSON export payload or CSV with matching columns.",
        "error",
      );
    }
  }

  async function mergeSyncedLibrary(
    mergedAssets: LocalAssetRecord[],
    mergedFolders: string[],
  ) {
    if (mergedFolders.length) {
      await bulkUpsertLocalFolders(mergedFolders);
    }
    if (mergedAssets.length) {
      await bulkUpsertLocalAssets(mergedAssets);
    }
    await refreshLibrary();
    notify(`Merged ${mergedAssets.length} assets from repo sync.`, "success");
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
    const credentialError = validateActiveProfile(config);
    if (credentialError) {
      setModelUpdateStatus(credentialError);
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

    const existing = assets.find((asset) => asset.assetId === targetModelAssetId.trim());
    const thumbnailDataUrl =
      existing?.thumbnailDataUrl ??
      (await createOptimizedPreview(file));

    if (existing) {
      const updated = replaceAssetVersion(existing, {
        assetId: response.assetId,
        fileName: file.name,
        name: targetModelName.trim() || existing.name,
        thumbnailDataUrl,
      });
      await upsertLocalAsset(updated);
    } else {
      await upsertLocalAsset(
        normalizeAssetVersions({
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
          versions: [],
        }),
      );
    }
    await refreshLibrary();
    setTargetModelName("");
    setModelUpdateStatus(`Model package updated for asset ${response.assetId}.`);
    if (modelFileRef.current) {
      modelFileRef.current.value = "";
    }
  }

  function handleSort(column: LibrarySortColumn) {
    setSort((current) => toggleLibrarySort(current, column));
  }

  const selectedCount = selectedAssetIds.size;

  const insertScriptAssets = useMemo((): InsertScriptAsset[] => {
    const source =
      selectedCount > 0
        ? assets.filter((asset) => selectedAssetIds.has(asset.id))
        : filteredAssets.filter((asset) => isInsertableStudioAsset(asset.type));

    return source.map((asset) => ({
      name: asset.name,
      assetId: asset.assetId,
      type: asset.type,
    }));
  }, [assets, filteredAssets, selectedAssetIds, selectedCount]);

  return (
    <section className="panel">
      <SectionHeader
        title="Asset library"
        description="Folders, tags, version history, search, drag-to-move, portable export, and Studio loaders — stored in IndexedDB on your machine."
        meta={`${assets.length} assets · ${folders.length} folders`}
      />

      <LibraryFilterBar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        onReset={clearFilters}
        selectedCount={selectedCount}
        selectionActions={
          <>
            <button type="button" className="library-compact-btn btn-secondary" onClick={deleteSelected}>
              Delete
            </button>
            <InsertServiceScriptTrigger
              assets={insertScriptAssets}
              className="library-compact-btn btn-primary"
              label={`Studio loader (${selectedCount})`}
            />
            <button
              type="button"
              className="library-compact-btn btn-secondary"
              onClick={() => exportSelection("json")}
            >
              Export JSON
            </button>
            <button
              type="button"
              className="library-compact-btn btn-secondary"
              onClick={() => exportSelection("csv")}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="library-compact-btn btn-secondary"
              onClick={() => exportCompactSelection()}
            >
              Compact JSON
            </button>
          </>
        }
      />

      <div className="mt-1.5">
        <LibraryTagsToolbar
          allTags={libraryTags}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          selectedCount={selectedCount}
          onApplyTags={(tags) => void applyBulkTags(tags)}
          onRemoveTagFromSelection={(tag) => void removeBulkTagFromSelection(tag)}
        />
      </div>

      <LibraryActionsBar>
        {selectedCount === 0 ? (
          <>
            <InsertServiceScriptTrigger
              assets={insertScriptAssets}
              className="library-compact-btn btn-primary"
              label="Studio loader"
            />
            <span className="library-actions-divider" aria-hidden />
          </>
        ) : null}
        <button
          type="button"
          className="library-compact-btn btn-secondary"
          onClick={() => exportFolderSelection("json")}
        >
          Folder JSON
        </button>
        <button
          type="button"
          className="library-compact-btn btn-secondary"
          onClick={() => exportFolderSelection("csv")}
        >
          Folder CSV
        </button>
        <button
          type="button"
          className="library-compact-btn btn-secondary"
          onClick={() => setSyncOpen(true)}
        >
          Sync
        </button>
        <button
          type="button"
          className="library-compact-btn btn-secondary"
          onClick={() => importRef.current?.click()}
        >
          Import
        </button>
      </LibraryActionsBar>
      <LibraryStatusSlot message={managerStatus} />

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
      <input
        ref={versionFileRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.mp3,.ogg,.wav,.flac,.fbx,.gltf,.glb,.rbxm,.rbxmx,.mesh"
        className="hidden"
        onChange={(event) => {
          handleVersionFileSelected(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <LibrarySyncModal
        open={syncOpen}
        localAssets={assets}
        onClose={() => setSyncOpen(false)}
        onMerge={mergeSyncedLibrary}
      />

      <LibraryCollectionsLayout
        loading={libraryLoading}
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
            onCreateFolder={createFolder}
            onRenameFolder={renameFolder}
            onReparentFolder={reparentFolder}
            onDeleteFolder={deleteFolder}
            onMoveAssetsToFolder={moveAssetsToFolder}
            onDropAssets={(folderPath, assetIds) => moveAssetsToFolder(folderPath, assetIds)}
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
          onAddTag={(assetId, tag) => void addTagToAsset(assetId, tag)}
          onRemoveTag={(assetId, tag) => void removeTagFromAsset(assetId, tag)}
          onQueueNewVersion={onQueueVersionUpload ? queueNewVersion : undefined}
          getTypeGlyph={getAssetTypeGlyph}
          emptyState={{
            icon: <IconFolder size={18} />,
            title: assets.length === 0 ? "Your library is empty" : "No assets found",
            description:
              assets.length === 0
                ? "Completed uploads land here automatically. Drag files to Upload, or sync a team manifest from Git."
                : "Try adjusting your search or filters.",
            action:
              assets.length === 0 ? (
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => setSyncOpen(true)}
                >
                  Sync from repo
                </button>
              ) : undefined,
          }}
        />
      </LibraryCollectionsLayout>

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
