import type { AssetVersionEntry, LocalAssetRecord } from "@/lib/types";

export function createVersionChainId(): string {
  return crypto.randomUUID();
}

export function normalizeAssetVersions(asset: Partial<LocalAssetRecord>): LocalAssetRecord {
  const versionChainId = asset.versionChainId ?? createVersionChainId();
  const versions = Array.isArray(asset.versions) ? asset.versions : [];

  return {
    id: asset.id ?? crypto.randomUUID(),
    name: asset.name ?? "Untitled",
    type: asset.type ?? "Image",
    assetId: asset.assetId ?? "",
    assetUri: asset.assetUri ?? (asset.assetId ? `rbxassetid://${asset.assetId}` : ""),
    thumbnailDataUrl: asset.thumbnailDataUrl,
    fileName: asset.fileName ?? "asset",
    folderPath: asset.folderPath ?? "Library",
    tags: asset.tags ?? [],
    createdAt: asset.createdAt ?? Date.now(),
    updatedAt: asset.updatedAt ?? Date.now(),
    versionChainId,
    versions,
  };
}

/** Replace current rbxassetid and archive the prior ID in version history. */
export function replaceAssetVersion(
  existing: LocalAssetRecord,
  next: {
    assetId: string;
    fileName: string;
    name?: string;
    thumbnailDataUrl?: string;
  },
): LocalAssetRecord {
  const now = Date.now();
  const priorVersion: AssetVersionEntry = {
    assetId: existing.assetId,
    replacedAt: now,
    fileName: existing.fileName,
    thumbnailDataUrl: existing.thumbnailDataUrl,
  };

  return {
    ...existing,
    assetId: next.assetId,
    assetUri: `rbxassetid://${next.assetId}`,
    fileName: next.fileName,
    name: next.name ?? existing.name,
    thumbnailDataUrl: next.thumbnailDataUrl ?? existing.thumbnailDataUrl,
    updatedAt: now,
    versions: [...existing.versions, priorVersion],
  };
}

export function getVersionCount(asset: LocalAssetRecord): number {
  return asset.versions.length + 1;
}

export function getLatestPriorVersion(asset: LocalAssetRecord): AssetVersionEntry | null {
  if (!asset.versions.length) {
    return null;
  }
  return asset.versions[asset.versions.length - 1] ?? null;
}

export interface AssetVersionOption {
  assetId: string;
  label: string;
  fileName: string;
  thumbnailDataUrl?: string;
  replacedAt: number;
  isCurrent: boolean;
}

/** Newest first — current, then prior versions. */
export function getAssetVersionOptions(asset: LocalAssetRecord): AssetVersionOption[] {
  const current: AssetVersionOption = {
    assetId: asset.assetId,
    label: "Current",
    fileName: asset.fileName,
    thumbnailDataUrl: asset.thumbnailDataUrl,
    replacedAt: asset.updatedAt,
    isCurrent: true,
  };

  const priors = [...asset.versions].reverse().map((entry, index) => ({
    assetId: entry.assetId,
    label: `v${asset.versions.length - index}`,
    fileName: entry.fileName ?? asset.fileName,
    thumbnailDataUrl: entry.thumbnailDataUrl,
    replacedAt: entry.replacedAt,
    isCurrent: false,
  }));

  return [current, ...priors];
}

export function resolveAssetVersionView(
  asset: LocalAssetRecord,
  viewingAssetId?: string,
): AssetVersionOption {
  const options = getAssetVersionOptions(asset);
  const selected =
    options.find((option) => option.assetId === viewingAssetId) ?? options[0];

  return selected ?? {
    assetId: asset.assetId,
    label: "Current",
    fileName: asset.fileName,
    thumbnailDataUrl: asset.thumbnailDataUrl,
    replacedAt: asset.updatedAt,
    isCurrent: true,
  };
}
