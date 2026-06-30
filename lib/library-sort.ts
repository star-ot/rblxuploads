import { normalizeTag } from "@/lib/library-tags";
import type { LocalAssetRecord } from "@/lib/types";

export type LibrarySortColumn =
  | "name"
  | "type"
  | "assetId"
  | "folderPath"
  | "tags"
  | "createdAt";

export type SortDirection = "asc" | "desc";

export interface LibrarySortState {
  column: LibrarySortColumn;
  direction: SortDirection;
}

export const DEFAULT_LIBRARY_SORT: LibrarySortState = {
  column: "createdAt",
  direction: "desc",
};

export const LIBRARY_SORT_COLUMN_LABELS: Record<LibrarySortColumn, string> = {
  name: "Name",
  type: "Type",
  assetId: "Asset ID",
  folderPath: "Collection",
  tags: "Tags",
  createdAt: "Date",
};

export function formatLibraryAssetDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function tagSortKey(tags: string[]): string {
  if (!tags.length) {
    return "\uffff";
  }

  return [...tags]
    .map(normalizeTag)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))[0]
    .toLowerCase();
}

function compareAssetIds(a: string, b: string): number {
  const aNumeric = /^\d+$/.test(a);
  const bNumeric = /^\d+$/.test(b);

  if (aNumeric && bNumeric) {
    if (a.length !== b.length) {
      return a.length - b.length;
    }
    return a.localeCompare(b, undefined, { numeric: true });
  }

  return a.localeCompare(b);
}

export function toggleLibrarySort(
  current: LibrarySortState,
  column: LibrarySortColumn,
): LibrarySortState {
  if (current.column !== column) {
    return {
      column,
      direction: column === "createdAt" ? "desc" : "asc",
    };
  }

  return {
    column,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

export function sortLibraryAssets<T extends LocalAssetRecord>(
  items: T[],
  sort: LibrarySortState,
): T[] {
  const sorted = [...items];
  const direction = sort.direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sort.column) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "type":
        comparison = a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
        break;
      case "assetId":
        comparison = compareAssetIds(a.assetId, b.assetId);
        break;
      case "folderPath":
        comparison =
          a.folderPath.localeCompare(b.folderPath) || a.name.localeCompare(b.name);
        break;
      case "tags":
        comparison = tagSortKey(a.tags).localeCompare(tagSortKey(b.tags));
        break;
      case "createdAt":
      default:
        comparison = a.createdAt - b.createdAt;
        break;
    }

    if (comparison === 0 && sort.column !== "name") {
      comparison = a.name.localeCompare(b.name);
    }

    return comparison * direction;
  });

  return sorted;
}
