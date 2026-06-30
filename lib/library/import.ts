import type {
  AssetType,
  CompactLibraryExport,
  LocalAssetExportPayload,
  LocalAssetRecord,
} from "@/lib/types";
import { normalizeFolderPath } from "@/lib/local-assets-db";
import { normalizeAssetVersions } from "@/lib/library/versioning";
import { fromCompactExport } from "@/lib/library/export";

function isCompactExport(value: unknown): value is CompactLibraryExport {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    (value as CompactLibraryExport).sv === 3 &&
    Array.isArray((value as CompactLibraryExport).a)
  );
}

export function parseLibraryImport(text: string): {
  assets: Partial<LocalAssetRecord>[];
  folders: string[];
  format?: "compact" | "full";
} {
  const parsed = JSON.parse(text) as
    | CompactLibraryExport
    | LocalAssetExportPayload
    | Array<Partial<LocalAssetRecord>>;

  if (Array.isArray(parsed)) {
    return { assets: parsed, folders: [] };
  }

  if (isCompactExport(parsed)) {
    const result = fromCompactExport(parsed);
    return { ...result, format: "compact" };
  }

  const full = parsed as LocalAssetExportPayload;
  const assets = (full.assets ?? []).map((asset) => normalizeAssetVersions(asset));
  const folders = Array.isArray(full.folders)
    ? full.folders.map((folder) => normalizeFolderPath(String(folder)))
    : [];
  return { assets, folders, format: "full" };
}

export function normalizeImportedType(type: string | undefined): AssetType {
  if (type === "Audio" || type === "Model" || type === "Image" || type === "Mesh") {
    return type;
  }
  return "Image";
}

export function normalizeImportedAssets(
  imported: Partial<LocalAssetRecord>[],
): LocalAssetRecord[] {
  return imported
    .filter(
      (asset): asset is Partial<LocalAssetRecord> & { name: string; assetId: string } =>
        Boolean(asset.name && asset.assetId),
    )
    .map((asset) =>
      normalizeAssetVersions({
        id: asset.id ?? crypto.randomUUID(),
        name: asset.name,
        type: normalizeImportedType(asset.type),
        assetId: asset.assetId,
        assetUri: asset.assetUri || `rbxassetid://${asset.assetId}`,
        thumbnailDataUrl:
          typeof asset.thumbnailDataUrl === "string" ? asset.thumbnailDataUrl : undefined,
        folderPath: normalizeFolderPath(asset.folderPath || "Library"),
        tags: asset.tags ?? [],
        fileName: asset.fileName ?? `${asset.name}.asset`,
        createdAt: asset.createdAt || Date.now(),
        updatedAt: Date.now(),
        versionChainId: asset.versionChainId,
        versions: asset.versions ?? [],
      }),
    );
}
