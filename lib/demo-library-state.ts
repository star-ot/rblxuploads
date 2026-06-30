import { DEMO_LIBRARY_ASSETS } from "@/lib/demo-library-assets";
import {
  getFolderAncestors,
  joinFolderPath,
  ROOT_FOLDER,
} from "@/lib/folder-tree";
import { normalizeFolderPath } from "@/lib/local-assets-db";
import type { LocalAssetRecord } from "@/lib/types";

export interface DemoLibraryState {
  assets: LocalAssetRecord[];
  folders: string[];
}

export function createInitialDemoLibraryState(): DemoLibraryState {
  const assets = DEMO_LIBRARY_ASSETS.map((asset) => ({ ...asset }));
  const folderSet = new Set<string>([ROOT_FOLDER]);

  for (const asset of assets) {
    for (const ancestor of getFolderAncestors(asset.folderPath)) {
      folderSet.add(ancestor);
    }
  }

  return {
    assets,
    folders: Array.from(folderSet).sort((a, b) => a.localeCompare(b)),
  };
}

export function createDemoFolder(
  folders: string[],
  parentPath: string,
  name: string,
): string[] {
  const normalized = joinFolderPath(parentPath, name);
  const next = new Set(folders);
  next.add(normalized);
  for (const ancestor of getFolderAncestors(normalized)) {
    next.add(ancestor);
  }
  return Array.from(next).sort((a, b) => a.localeCompare(b));
}

export function renameDemoFolderTree(
  state: DemoLibraryState,
  sourceFolderPath: string,
  targetFolderPath: string,
): DemoLibraryState & { renamedFolders: number; movedAssets: number } {
  const source = normalizeFolderPath(sourceFolderPath);
  const target = normalizeFolderPath(targetFolderPath);

  if (source === ROOT_FOLDER) {
    throw new Error("The root folder cannot be renamed.");
  }
  if (!source || source === target) {
    return { ...state, renamedFolders: 0, movedAssets: 0 };
  }
  if (target.startsWith(`${source}/`)) {
    throw new Error("Cannot rename a folder into one of its descendants.");
  }

  const toRename = state.folders.filter(
    (path) => path === source || path.startsWith(`${source}/`),
  );
  const nextFolderSet = new Set(state.folders);
  let renamedFolders = 0;

  for (const oldPath of toRename) {
    nextFolderSet.delete(oldPath);
    const suffix = oldPath === source ? "" : oldPath.slice(source.length);
    nextFolderSet.add(`${target}${suffix}`);
    renamedFolders += 1;
  }

  nextFolderSet.add(ROOT_FOLDER);
  for (const path of Array.from(nextFolderSet)) {
    const parts = path.split("/");
    for (let i = 0; i < parts.length; i += 1) {
      nextFolderSet.add(parts.slice(0, i + 1).join("/"));
    }
  }

  let movedAssets = 0;
  const assets = state.assets.map((asset) => {
    const current = normalizeFolderPath(asset.folderPath);
    if (current === source || current.startsWith(`${source}/`)) {
      const suffix = current === source ? "" : current.slice(source.length);
      movedAssets += 1;
      return {
        ...asset,
        folderPath: `${target}${suffix}`,
        updatedAt: Date.now(),
      };
    }
    return asset;
  });

  return {
    assets,
    folders: Array.from(nextFolderSet).sort((a, b) => a.localeCompare(b)),
    renamedFolders,
    movedAssets,
  };
}

export function deleteDemoFolderTree(
  state: DemoLibraryState,
  folderPath: string,
): DemoLibraryState & { deletedFolders: number; movedAssets: number } {
  const target = normalizeFolderPath(folderPath);
  if (target === ROOT_FOLDER) {
    throw new Error("The root folder cannot be deleted.");
  }

  const folders = state.folders.filter(
    (path) => path !== target && !path.startsWith(`${target}/`),
  );
  const deletedFolders = state.folders.length - folders.length;

  let movedAssets = 0;
  const assets = state.assets.map((asset) => {
    const current = normalizeFolderPath(asset.folderPath);
    if (current === target || current.startsWith(`${target}/`)) {
      movedAssets += 1;
      return {
        ...asset,
        folderPath: ROOT_FOLDER,
        updatedAt: Date.now(),
      };
    }
    return asset;
  });

  const folderSet = new Set(folders);
  folderSet.add(ROOT_FOLDER);

  return {
    assets,
    folders: Array.from(folderSet).sort((a, b) => a.localeCompare(b)),
    deletedFolders,
    movedAssets,
  };
}

export function moveDemoAssets(
  assets: LocalAssetRecord[],
  assetIds: string[],
  folderPath: string,
): LocalAssetRecord[] {
  const idSet = new Set(assetIds);
  const target = normalizeFolderPath(folderPath);

  return assets.map((asset) =>
    idSet.has(asset.id)
      ? {
          ...asset,
          folderPath: target,
          updatedAt: Date.now(),
        }
      : asset,
  );
}
