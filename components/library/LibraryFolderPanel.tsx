"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import {
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@/components/ui/Icon";
import {
  ROOT_FOLDER,
  computeRenamedFolderPath,
  computeReparentedFolderPath,
  getFolderAncestors,
  getFolderName,
  getParentFolderPath,
  getValidParentFolders,
  joinFolderPath,
  type FolderTreeNode,
} from "@/lib/folder-tree";

const ALL_FOLDERS = "all";

interface LibraryFolderPanelProps {
  folderTree: FolderTreeNode[];
  folderPaths: string[];
  totalAssetCount: number;
  nestedAssetCounts: Map<string, number>;
  selectedFolder: string;
  folderFilter: string;
  expandedPaths: Set<string>;
  selectedAssetCount: number;
  onSelectAllAssets: () => void;
  onSelectFolder: (folderPath: string) => void;
  onToggleExpand: (folderPath: string) => void;
  onCreateFolder: (parentPath: string, name: string) => Promise<void>;
  onRenameFolder: (folderPath: string, newName: string) => Promise<void>;
  onReparentFolder: (folderPath: string, newParentPath: string) => Promise<void>;
  onDeleteFolder: (folderPath: string) => Promise<void>;
  onMoveAssetsToFolder: (folderPath: string) => Promise<void>;
  onDropAssets: (folderPath: string, assetIds: string[]) => Promise<void>;
}

export function LibraryFolderPanel({
  folderTree,
  folderPaths,
  totalAssetCount,
  nestedAssetCounts,
  selectedFolder,
  folderFilter,
  expandedPaths,
  selectedAssetCount,
  onSelectAllAssets,
  onSelectFolder,
  onToggleExpand,
  onCreateFolder,
  onRenameFolder,
  onReparentFolder,
  onDeleteFolder,
  onMoveAssetsToFolder,
  onDropAssets,
}: LibraryFolderPanelProps) {
  const [creatingUnder, setCreatingUnder] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dropTargetPath, setDropTargetPath] = useState<string | null>(null);
  const [inspectorParent, setInspectorParent] = useState(ROOT_FOLDER);
  const createInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const showInspector = folderFilter !== ALL_FOLDERS && selectedFolder !== ROOT_FOLDER;
  const validParents = useMemo(
    () => getValidParentFolders(folderPaths, selectedFolder),
    [folderPaths, selectedFolder],
  );

  useEffect(() => {
    if (creatingUnder) {
      createInputRef.current?.focus();
    }
  }, [creatingUnder]);

  useEffect(() => {
    if (renamingPath) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingPath]);

  useEffect(() => {
    setInspectorParent(getParentFolderPath(selectedFolder) ?? ROOT_FOLDER);
  }, [selectedFolder]);

  function startCreate(parentPath: string) {
    setCreatingUnder(parentPath);
    setCreateName("");
    setRenamingPath(null);
    for (const ancestor of getFolderAncestors(parentPath)) {
      if (!expandedPaths.has(ancestor)) {
        onToggleExpand(ancestor);
      }
    }
  }

  function startRename(folderPath: string) {
    setRenamingPath(folderPath);
    setRenameValue(getFolderName(folderPath));
    setCreatingUnder(null);
    setCreateName("");
  }

  async function submitCreate() {
    if (!creatingUnder || !createName.trim()) {
      setCreatingUnder(null);
      return;
    }
    await onCreateFolder(creatingUnder, createName);
    setCreatingUnder(null);
    setCreateName("");
  }

  async function submitRename() {
    if (!renamingPath || !renameValue.trim()) {
      setRenamingPath(null);
      return;
    }
    await onRenameFolder(renamingPath, renameValue);
    setRenamingPath(null);
    setRenameValue("");
  }

  function handleCreateKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void submitCreate();
    }
    if (event.key === "Escape") {
      setCreatingUnder(null);
      setCreateName("");
    }
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void submitRename();
    }
    if (event.key === "Escape") {
      setRenamingPath(null);
    }
  }

  function handleDragOver(event: DragEvent, folderPath: string) {
    if (!event.dataTransfer.types.includes("application/x-rblxuploads-assets")) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetPath(folderPath);
  }

  function handleDragLeave(folderPath: string) {
    setDropTargetPath((current) => (current === folderPath ? null : current));
  }

  async function handleDrop(event: DragEvent, folderPath: string) {
    event.preventDefault();
    setDropTargetPath(null);
    const raw = event.dataTransfer.getData("application/x-rblxuploads-assets");
    if (!raw) {
      return;
    }
    try {
      const assetIds = JSON.parse(raw) as string[];
      if (Array.isArray(assetIds) && assetIds.length) {
        await onDropAssets(folderPath, assetIds);
      }
    } catch {
      // ignore malformed drag payload
    }
  }

  return (
    <aside className="flex min-h-[28rem] flex-col rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-2 py-2">
        <p className="label px-1">Collections</p>
        <button
          type="button"
          className="btn-ghost px-2 py-1 text-[12px]"
          onClick={() => startCreate(selectedFolder)}
          title={`New folder inside ${getFolderName(selectedFolder)}`}
        >
          <IconPlus size={13} />
          New folder
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <button
          type="button"
          className={`mb-1 flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors ${
            folderFilter === ALL_FOLDERS
              ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
          }`}
          onClick={onSelectAllAssets}
        >
          <span className="flex items-center gap-2">
            <IconFolder size={14} className="shrink-0 opacity-60" />
            All assets
          </span>
          <span className="font-mono text-[11px] text-[var(--text-faint)]">{totalAssetCount}</span>
        </button>

        {folderTree.map((node) => (
          <FolderTreeItem
            key={node.path}
            node={node}
            depth={0}
            selectedFolder={selectedFolder}
            folderFilter={folderFilter}
            expandedPaths={expandedPaths}
            nestedAssetCounts={nestedAssetCounts}
            creatingUnder={creatingUnder}
            createName={createName}
            createInputRef={createInputRef}
            renamingPath={renamingPath}
            renameValue={renameValue}
            renameInputRef={renameInputRef}
            dropTargetPath={dropTargetPath}
            onSelect={onSelectFolder}
            onToggleExpand={onToggleExpand}
            onStartCreate={startCreate}
            onStartRename={startRename}
            onDelete={(path) => void onDeleteFolder(path)}
            onCreateNameChange={setCreateName}
            onRenameValueChange={setRenameValue}
            onSubmitCreate={() => void submitCreate()}
            onSubmitRename={() => void submitRename()}
            onCreateKeyDown={handleCreateKeyDown}
            onRenameKeyDown={handleRenameKeyDown}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {showInspector ? (
        <div className="border-t border-[var(--border-subtle)] p-3">
          <p className="label mb-2">Folder</p>
          <p className="mb-3 truncate font-mono text-[11px] text-[var(--text-faint)]">
            {selectedFolder}
          </p>

          <div className="space-y-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-[var(--text-muted)]">Parent</span>
              <select
                className="field-input text-[13px]"
                value={inspectorParent}
                onChange={(event) => setInspectorParent(event.target.value)}
              >
                {validParents.map((path) => (
                  <option key={path} value={path}>
                    {path}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary flex-1 text-[12px]"
                disabled={inspectorParent === (getParentFolderPath(selectedFolder) ?? ROOT_FOLDER)}
                onClick={() => void onReparentFolder(selectedFolder, inspectorParent)}
              >
                Move folder here
              </button>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-[var(--text-muted)]">Name</span>
              <div className="flex gap-2">
                <input
                  className="field-input flex-1 text-[13px]"
                  value={renamingPath === selectedFolder ? renameValue : getFolderName(selectedFolder)}
                  onChange={(event) => {
                    if (renamingPath !== selectedFolder) {
                      startRename(selectedFolder);
                    }
                    setRenameValue(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void onRenameFolder(selectedFolder, renameValue || getFolderName(selectedFolder));
                      setRenamingPath(null);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary shrink-0 text-[12px]"
                  onClick={() =>
                    void onRenameFolder(
                      selectedFolder,
                      renamingPath === selectedFolder ? renameValue : getFolderName(selectedFolder),
                    )
                  }
                >
                  Rename
                </button>
              </div>
            </label>

            {selectedAssetCount > 0 ? (
              <button
                type="button"
                className="btn-primary w-full text-[13px]"
                onClick={() => void onMoveAssetsToFolder(selectedFolder)}
              >
                Move {selectedAssetCount} asset{selectedAssetCount === 1 ? "" : "s"} here
              </button>
            ) : (
              <p className="caption text-center">
                Select assets in the table, then move or drag them onto a folder.
              </p>
            )}

            <button
              type="button"
              className="btn-ghost w-full text-[12px] text-[var(--danger-text)] hover:bg-[var(--danger-bg)]"
              onClick={() => void onDeleteFolder(selectedFolder)}
            >
              <IconTrash size={13} className="mr-1 inline" />
              Delete folder
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-[var(--border-subtle)] p-3">
          {selectedAssetCount > 0 ? (
            <p className="caption mb-2 text-center">
              {selectedAssetCount} asset{selectedAssetCount === 1 ? "" : "s"} selected — drag onto a
              folder or pick one to move.
            </p>
          ) : (
            <p className="caption text-center">
              Select a folder to rename, reparent, or create subfolders. Drag assets onto folders to
              move them.
            </p>
          )}
          {selectedAssetCount > 0 && folderFilter !== ALL_FOLDERS ? (
            <button
              type="button"
              className="btn-primary mt-2 w-full text-[13px]"
              onClick={() => void onMoveAssetsToFolder(selectedFolder)}
            >
              Move to {getFolderName(selectedFolder)}
            </button>
          ) : null}
        </div>
      )}
    </aside>
  );
}

interface FolderTreeItemProps {
  node: FolderTreeNode;
  depth: number;
  selectedFolder: string;
  folderFilter: string;
  expandedPaths: Set<string>;
  nestedAssetCounts: Map<string, number>;
  creatingUnder: string | null;
  createName: string;
  createInputRef: React.RefObject<HTMLInputElement | null>;
  renamingPath: string | null;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  dropTargetPath: string | null;
  onSelect: (folderPath: string) => void;
  onToggleExpand: (folderPath: string) => void;
  onStartCreate: (parentPath: string) => void;
  onStartRename: (folderPath: string) => void;
  onDelete: (folderPath: string) => void;
  onCreateNameChange: (value: string) => void;
  onRenameValueChange: (value: string) => void;
  onSubmitCreate: () => void;
  onSubmitRename: () => void;
  onCreateKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onRenameKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onDragOver: (event: DragEvent, folderPath: string) => void;
  onDragLeave: (folderPath: string) => void;
  onDrop: (event: DragEvent, folderPath: string) => void;
}

function FolderTreeItem({
  node,
  depth,
  selectedFolder,
  folderFilter,
  expandedPaths,
  nestedAssetCounts,
  creatingUnder,
  createName,
  createInputRef,
  renamingPath,
  renameValue,
  renameInputRef,
  dropTargetPath,
  onSelect,
  onToggleExpand,
  onStartCreate,
  onStartRename,
  onDelete,
  onCreateNameChange,
  onRenameValueChange,
  onSubmitCreate,
  onSubmitRename,
  onCreateKeyDown,
  onRenameKeyDown,
  onDragOver,
  onDragLeave,
  onDrop,
}: FolderTreeItemProps) {
  const hasChildren = node.children.length > 0 || creatingUnder === node.path;
  const isExpanded = expandedPaths.has(node.path);
  const isActive = folderFilter === node.path;
  const isDropTarget = dropTargetPath === node.path;
  const isRenaming = renamingPath === node.path;

  return (
    <div>
      <div
        className={`group mb-0.5 flex items-center gap-0.5 rounded-md pr-1 transition-colors ${
          isActive
            ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
            : isDropTarget
              ? "bg-[var(--accent-subtle)] ring-1 ring-[var(--accent)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        }`}
        onDragOver={(event) => onDragOver(event, node.path)}
        onDragLeave={() => onDragLeave(node.path)}
        onDrop={(event) => void onDrop(event, node.path)}
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

        {isRenaming ? (
          <div
            className="flex min-h-7 flex-1 items-center gap-1 py-1"
            style={{ paddingLeft: `${depth * 0.5}rem` }}
          >
            <input
              ref={renameInputRef}
              className="field-input min-w-0 flex-1 py-1 text-[12px]"
              value={renameValue}
              onChange={(event) => onRenameValueChange(event.target.value)}
              onKeyDown={onRenameKeyDown}
              onBlur={onSubmitRename}
            />
          </div>
        ) : (
          <button
            type="button"
            className="flex min-h-7 flex-1 items-center justify-between gap-2 rounded py-1.5 text-left text-[13px]"
            style={{ paddingLeft: `${depth * 0.5}rem` }}
            onClick={() => onSelect(node.path)}
            onDoubleClick={() => onStartRename(node.path)}
          >
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              <IconFolder size={13} className="shrink-0 opacity-50" />
              {node.name}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-[var(--text-faint)]">
              {nestedAssetCounts.get(node.path) ?? 0}
            </span>
          </button>
        )}

        {!isRenaming ? (
          <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              title="New subfolder"
              onClick={() => onStartCreate(node.path)}
            >
              <IconPlus size={12} />
            </button>
            {node.path !== ROOT_FOLDER ? (
              <>
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  title="Rename"
                  onClick={() => onStartRename(node.path)}
                >
                  <IconPencil size={12} />
                </button>
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)]"
                  title="Delete folder"
                  onClick={() => onDelete(node.path)}
                >
                  <IconTrash size={12} />
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {creatingUnder === node.path ? (
        <div
          className="mb-1 flex items-center gap-1 pr-1"
          style={{ paddingLeft: `${(depth + 1) * 0.5 + 1.5}rem` }}
        >
          <IconFolder size={12} className="shrink-0 text-[var(--text-faint)]" />
          <input
            ref={createInputRef}
            className="field-input min-w-0 flex-1 py-1 text-[12px]"
            placeholder="New folder name"
            value={createName}
            onChange={(event) => onCreateNameChange(event.target.value)}
            onKeyDown={onCreateKeyDown}
            onBlur={onSubmitCreate}
          />
        </div>
      ) : null}

      {hasChildren && isExpanded ? (
        <div>
          {node.children.map((child) => (
            <FolderTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFolder={selectedFolder}
              folderFilter={folderFilter}
              expandedPaths={expandedPaths}
              nestedAssetCounts={nestedAssetCounts}
              creatingUnder={creatingUnder}
              createName={createName}
              createInputRef={createInputRef}
              renamingPath={renamingPath}
              renameValue={renameValue}
              renameInputRef={renameInputRef}
              dropTargetPath={dropTargetPath}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onStartCreate={onStartCreate}
              onStartRename={onStartRename}
              onDelete={onDelete}
              onCreateNameChange={onCreateNameChange}
              onRenameValueChange={onRenameValueChange}
              onSubmitCreate={onSubmitCreate}
              onSubmitRename={onSubmitRename}
              onCreateKeyDown={onCreateKeyDown}
              onRenameKeyDown={onRenameKeyDown}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { ALL_FOLDERS as ALL_FOLDERS_OPTION };
