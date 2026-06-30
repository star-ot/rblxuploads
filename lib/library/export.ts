import { normalizeAssetVersions } from "@/lib/library/versioning";
import type {
  CompactAssetRecord,
  CompactLibraryExport,
  LocalAssetExportPayload,
  LocalAssetRecord,
} from "@/lib/types";

const COMPACT_PREVIEW_MAX_CHARS = 12_000;

export function toCompactExport(
  assets: LocalAssetRecord[],
  folders: string[],
): CompactLibraryExport {
  return {
    sv: 3,
    at: new Date().toISOString(),
    f: folders,
    a: assets.map(toCompactAsset),
  };
}

export function fromCompactExport(payload: CompactLibraryExport): {
  assets: LocalAssetRecord[];
  folders: string[];
} {
  const folders = Array.isArray(payload.f) ? payload.f : [];
  const assets = (payload.a ?? []).map(fromCompactAsset);
  return { assets, folders };
}

export function parseCompactOrFullExport(text: string): {
  assets: LocalAssetRecord[];
  folders: string[];
  format: "compact" | "full";
} {
  const parsed = JSON.parse(text) as CompactLibraryExport | LocalAssetExportPayload;

  if (isCompactExport(parsed)) {
    const result = fromCompactExport(parsed);
    return { ...result, format: "compact" };
  }

  const full = parsed as LocalAssetExportPayload;
  const assets = (full.assets ?? []).map((asset) => normalizeAssetVersions(asset));
  const folders = Array.isArray(full.folders) ? full.folders : [];
  return { assets, folders, format: "full" };
}

export function serializeCompactExport(payload: CompactLibraryExport, pretty = false): string {
  return JSON.stringify(payload, null, pretty ? 2 : 0);
}

export function estimateCompactSize(payload: CompactLibraryExport): number {
  return serializeCompactExport(payload).length;
}

function toCompactAsset(asset: LocalAssetRecord): CompactAssetRecord {
  const normalized = normalizeAssetVersions(asset);
  const compact: CompactAssetRecord = {
    c: normalized.versionChainId,
    n: normalized.name,
    t: normalized.type,
    i: normalized.assetId,
  };

  if (normalized.fileName && normalized.fileName !== `${normalized.name}.asset`) {
    compact.fn = normalized.fileName;
  }
  if (normalized.folderPath && normalized.folderPath !== "Library") {
    compact.fp = normalized.folderPath;
  }
  if (normalized.tags.length) {
    compact.g = normalized.tags;
  }
  if (normalized.thumbnailDataUrl && normalized.thumbnailDataUrl.length <= COMPACT_PREVIEW_MAX_CHARS) {
    compact.p = normalized.thumbnailDataUrl;
  }
  if (normalized.versions.length) {
    compact.v = normalized.versions.map((entry) => ({
      i: entry.assetId,
      at: entry.replacedAt,
      ...(entry.fileName ? { fn: entry.fileName } : {}),
      ...(entry.thumbnailDataUrl && entry.thumbnailDataUrl.length <= COMPACT_PREVIEW_MAX_CHARS
        ? { p: entry.thumbnailDataUrl }
        : {}),
    }));
  }

  return compact;
}

function fromCompactAsset(record: CompactAssetRecord): LocalAssetRecord {
  return normalizeAssetVersions({
    id: crypto.randomUUID(),
    versionChainId: record.c,
    name: record.n,
    type: record.t,
    assetId: record.i,
    assetUri: `rbxassetid://${record.i}`,
    fileName: record.fn ?? `${record.n}.asset`,
    folderPath: record.fp ?? "Library",
    tags: record.g ?? [],
    thumbnailDataUrl: record.p,
    versions: (record.v ?? []).map((entry) => ({
      assetId: entry.i,
      replacedAt: entry.at,
      fileName: entry.fn,
      thumbnailDataUrl: entry.p,
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

function isCompactExport(value: unknown): value is CompactLibraryExport {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    (value as CompactLibraryExport).sv === 3 &&
    Array.isArray((value as CompactLibraryExport).a)
  );
}
