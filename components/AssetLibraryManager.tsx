"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  bulkUpsertLocalAssets,
  getRootFolderPath,
  listLocalAssets,
  listLocalFolders,
  normalizeFolderPath,
  removeLocalAssets,
  upsertLocalAsset,
  upsertLocalFolder,
} from "@/lib/local-assets-db";
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
  const [newFolderPath, setNewFolderPath] = useState("");
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

  const directFolderAssetCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const asset of assets) {
      counts.set(asset.folderPath, (counts.get(asset.folderPath) ?? 0) + 1);
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

  async function createFolder() {
    const normalized = normalizeFolderPath(newFolderPath);
    await upsertLocalFolder(normalized);
    setNewFolderPath("");
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
    setExpandedFolderPaths((current) => {
      const next = new Set(current);
      for (const ancestor of getFolderAncestors(folderPath)) {
        next.add(ancestor);
      }
      return next;
    });
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
    format: "json" | "csv",
    label: string,
  ) {
    const payload: LocalAssetExportPayload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      folders: Array.from(new Set(selected.map((asset) => asset.folderPath))),
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
    exportAssets(selected, format, "assets");
  }

  function exportFolderSelection(format: "json" | "csv") {
    const fromFolder = assets.filter((asset) => asset.folderPath === selectedFolder);
    if (!fromFolder.length) {
      setManagerStatus(`No assets in ${selectedFolder} to export.`);
      return;
    }
    exportAssets(fromFolder, format, `assets from ${selectedFolder}`);
  }

  async function importLibrary(file: File) {
    try {
      const text = await file.text();
      const imported = file.name.toLowerCase().endsWith(".csv")
        ? parseCsvImport(text)
        : parseJsonImport(text);

      if (!imported.length) {
        setManagerStatus("No importable assets were found in the selected file.");
        return;
      }

      const normalized = imported
        .filter((asset): asset is Partial<LocalAssetRecord> & { name: string; assetId: string } =>
          Boolean(asset.name && asset.assetId),
        )
        .map((asset) => ({
          id: asset.id || crypto.randomUUID(),
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

      if (!normalized.length) {
        setManagerStatus("Import file was valid but had no assets with name + assetId.");
        return;
      }

      await bulkUpsertLocalAssets(normalized);
      await refreshLibrary();
      setManagerStatus(`Imported ${normalized.length} assets from ${file.name}.`);
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
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-[var(--text-primary)]">Local asset library</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            IndexedDB-backed local records with folders, tags, fast filters, and portable import/export.
          </p>
        </div>
        <div className="font-mono text-xs text-[var(--text-muted)]">
          {assets.length} assets · {folders.length} folders
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          className="field-input"
          placeholder="Search name, id, folder, tags…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <input
          className="field-input"
          placeholder="Filter by tag"
          value={tagFilter}
          onChange={(event) => setTagFilter(event.target.value)}
        />
        <select
          className="field-input"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as "all" | AssetType)}
        >
          <option value="all">All types</option>
          <option value="Image">Image</option>
          <option value="Audio">Audio</option>
          <option value="Model">Model</option>
          <option value="Mesh">Mesh</option>
        </select>
        <select
          className="field-input"
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as SortKey)}
        >
          <option value="newest">Sort: newest first</option>
          <option value="oldest">Sort: oldest first</option>
          <option value="name-asc">Sort: name A-Z</option>
          <option value="name-desc">Sort: name Z-A</option>
          <option value="type">Sort: type</option>
        </select>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="flex gap-2">
          <input
            className="field-input"
            placeholder="New subfolder (e.g. Library/Pack/VFX)"
            value={newFolderPath}
            onChange={(event) => setNewFolderPath(event.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={createFolder}>
            Add
          </button>
        </div>
        <select
          className="field-input"
          value={selectedFolder}
          onChange={(event) => setSelectedFolder(event.target.value)}
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

      <div className="mt-3 flex flex-wrap gap-2">
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
        <button type="button" className="btn-secondary" onClick={deleteSelected}>
          Delete selected
        </button>
      </div>
      {managerStatus ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">{managerStatus}</p>
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-2">
          <p className="px-2 pb-2 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Explorer
          </p>
          <button
            type="button"
            className={`mb-2 flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${
              folderFilter === ALL_FOLDERS_OPTION
                ? "bg-[var(--accent-glow)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
            }`}
            onClick={() => setFolderFilter(ALL_FOLDERS_OPTION)}
          >
            <span>All folders</span>
            <span className="font-mono text-xs">{assets.length}</span>
          </button>
          <div className="max-h-[24rem] overflow-y-auto pr-1">
            {folderTree.map((node) => (
              <FolderTreeItem
                key={node.path}
                node={node}
                depth={0}
                selectedFolder={folderFilter}
                expandedPaths={expandedFolderPaths}
                directAssetCounts={directFolderAssetCounts}
                onSelect={selectFolder}
                onToggleExpand={toggleFolderExpansion}
              />
            ))}
          </div>
        </aside>

        <div className="max-h-[24rem] overflow-y-auto rounded-lg border border-[var(--border-subtle)]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-3 py-2 font-medium">
                  <input
                    type="checkbox"
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
                <th className="px-3 py-2 font-medium">Thumb</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">rbxassetid</th>
                <th className="px-3 py-2 font-medium">Folder</th>
                <th className="px-3 py-2 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] last:border-0"
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
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
                  <td className="px-3 py-2">
                    {asset.thumbnailDataUrl ? (
                      <img
                        src={asset.thumbnailDataUrl}
                        alt={asset.name}
                        className="h-8 w-8 rounded border border-[var(--border)] object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border)] bg-[var(--surface)] text-[10px] text-[var(--text-muted)]">
                        {getAssetTypeGlyph(asset.type)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-primary)]">{asset.name}</td>
                  <td className="px-3 py-2">{asset.type}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-xs"
                      onClick={() => navigator.clipboard.writeText(asset.assetUri)}
                    >
                      {asset.assetUri}
                    </button>
                  </td>
                  <td className="px-3 py-2">{asset.folderPath}</td>
                  <td className="px-3 py-2">{asset.tags.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAssets.length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-muted)]">
              No assets match current filters.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3">
        <h3 className="font-display text-base text-[var(--text-primary)]">
          Update model package
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Roblox currently allows package content updates for models (FBX upload).
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
          <p className="mt-2 text-xs text-[var(--text-muted)]">{modelUpdateStatus}</p>
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
  directAssetCounts: Map<string, number>;
  onSelect: (folderPath: string) => void;
  onToggleExpand: (folderPath: string) => void;
}

function FolderTreeItem({
  node,
  depth,
  selectedFolder,
  expandedPaths,
  directAssetCounts,
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
        className={`mb-0.5 flex items-center gap-1 rounded pr-1 ${
          isSelected
            ? "bg-[var(--accent-glow)] text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
        }`}
      >
        <button
          type="button"
          className={`h-7 w-6 text-center text-xs ${hasChildren ? "" : "opacity-0"}`}
          onClick={() => {
            if (hasChildren) {
              onToggleExpand(node.path);
            }
          }}
          aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
        >
          {isExpanded ? "v" : ">"}
        </button>
        <button
          type="button"
          className="flex min-h-7 flex-1 items-center justify-between rounded py-1 text-left text-sm"
          style={{ paddingLeft: `${depth * 0.65}rem` }}
          onClick={() => onSelect(node.path)}
        >
          <span className="truncate">{node.name}</span>
          <span className="ml-2 font-mono text-xs text-[var(--text-muted)]">
            {directAssetCounts.get(node.path) ?? 0}
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
              directAssetCounts={directAssetCounts}
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

function parseJsonImport(text: string): Partial<LocalAssetRecord>[] {
  const parsed = JSON.parse(text) as
    | LocalAssetExportPayload
    | Array<Partial<LocalAssetRecord>>;
  if (Array.isArray(parsed)) {
    return parsed;
  }
  return Array.isArray(parsed.assets) ? parsed.assets : [];
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
