import type { AssetType, LocalAssetRecord } from "@/lib/types";

export function matchesLibrarySearch(
  asset: LocalAssetRecord,
  searchText: string,
): boolean {
  const query = searchText.trim().toLowerCase();
  if (!query) {
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

  return haystack.includes(query);
}

export function filterLibraryAssets(
  assets: LocalAssetRecord[],
  options: {
    search?: string;
    typeFilter?: AssetType | "all";
    folderPath?: string | null;
  },
): LocalAssetRecord[] {
  const search = options.search ?? "";
  const typeFilter = options.typeFilter ?? "all";
  const folderPath = options.folderPath;

  return assets.filter((asset) => {
    if (typeFilter !== "all" && asset.type !== typeFilter) {
      return false;
    }

    if (
      folderPath &&
      asset.folderPath !== folderPath &&
      !asset.folderPath.startsWith(`${folderPath}/`)
    ) {
      return false;
    }

    return matchesLibrarySearch(asset, search);
  });
}

export function getAssetTypeGlyph(type: AssetType): string {
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
