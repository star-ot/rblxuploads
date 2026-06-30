import { getRootFolderPath, normalizeFolderPath } from "@/lib/local-assets-db";

export const ROOT_FOLDER = getRootFolderPath();

export interface FolderTreeNode {
  name: string;
  path: string;
  children: FolderTreeNode[];
}

export function getFolderName(folderPath: string): string {
  const normalized = normalizeFolderPath(folderPath);
  const segments = normalized.split("/");
  return segments[segments.length - 1] || ROOT_FOLDER;
}

export function getParentFolderPath(folderPath: string): string | null {
  const normalized = normalizeFolderPath(folderPath);
  if (normalized === ROOT_FOLDER) {
    return null;
  }
  const segments = normalized.split("/");
  if (segments.length <= 1) {
    return null;
  }
  return segments.slice(0, -1).join("/");
}

export function joinFolderPath(parentPath: string, name: string): string {
  const parent = normalizeFolderPath(parentPath);
  const segment = name.trim().replaceAll("/", "").replaceAll("\\", "");
  if (!segment) {
    return parent;
  }
  return parent === ROOT_FOLDER ? `${ROOT_FOLDER}/${segment}` : `${parent}/${segment}`;
}

export function computeRenamedFolderPath(folderPath: string, newName: string): string {
  const parent = getParentFolderPath(folderPath);
  const segment = newName.trim().replaceAll("/", "").replaceAll("\\", "");
  if (!segment) {
    return normalizeFolderPath(folderPath);
  }
  if (!parent) {
    return segment === ROOT_FOLDER ? ROOT_FOLDER : `${ROOT_FOLDER}/${segment}`;
  }
  return joinFolderPath(parent, segment);
}

export function computeReparentedFolderPath(folderPath: string, newParentPath: string): string {
  const source = normalizeFolderPath(folderPath);
  const parent = normalizeFolderPath(newParentPath);
  const name = getFolderName(source);
  if (source === ROOT_FOLDER) {
    return ROOT_FOLDER;
  }
  return joinFolderPath(parent, name);
}

export function isFolderDescendantOf(folderPath: string, ancestorPath: string): boolean {
  const folder = normalizeFolderPath(folderPath);
  const ancestor = normalizeFolderPath(ancestorPath);
  return folder === ancestor || folder.startsWith(`${ancestor}/`);
}

export function getFolderAncestors(folderPath: string): string[] {
  const normalized = normalizeFolderPath(folderPath);
  const parts = normalized.split("/");
  const ancestors: string[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    ancestors.push(parts.slice(0, i + 1).join("/"));
  }
  return ancestors;
}

export function buildFolderTree(folderPaths: string[]): FolderTreeNode[] {
  const byPath = new Map<string, FolderTreeNode>();

  const getOrCreate = (path: string): FolderTreeNode => {
    const existing = byPath.get(path);
    if (existing) {
      return existing;
    }
    const node: FolderTreeNode = {
      name: getFolderName(path),
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

export function getValidParentFolders(
  folderPaths: string[],
  sourceFolder: string,
): string[] {
  const source = normalizeFolderPath(sourceFolder);
  return folderPaths.filter((path) => {
    const normalized = normalizeFolderPath(path);
    if (source === ROOT_FOLDER) {
      return false;
    }
    if (normalized === source) {
      return false;
    }
    if (isFolderDescendantOf(normalized, source)) {
      return false;
    }
    return true;
  });
}

export function buildNestedAssetCounts(assets: Array<{ folderPath: string }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const asset of assets) {
    for (const ancestor of getFolderAncestors(asset.folderPath)) {
      counts.set(ancestor, (counts.get(ancestor) ?? 0) + 1);
    }
  }
  return counts;
}
