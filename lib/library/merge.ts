import type { LocalAssetRecord } from "@/lib/types";

export type MergeConflictResolution = "keep-local" | "keep-remote" | "keep-both";

export interface LibraryMergeConflict {
  assetId: string;
  local: LocalAssetRecord;
  remote: LocalAssetRecord;
}

export interface LibraryMergePlan {
  toUpsert: LocalAssetRecord[];
  conflicts: LibraryMergeConflict[];
  remoteOnly: LocalAssetRecord[];
  localOnly: LocalAssetRecord[];
}

/** Build a merge plan keyed by Roblox assetId. */
export function planLibraryMerge(
  localAssets: LocalAssetRecord[],
  remoteAssets: LocalAssetRecord[],
): LibraryMergePlan {
  const localByAssetId = new Map(localAssets.map((a) => [a.assetId, a]));
  const remoteByAssetId = new Map(remoteAssets.map((a) => [a.assetId, a]));

  const toUpsert: LocalAssetRecord[] = [];
  const conflicts: LibraryMergeConflict[] = [];
  const remoteOnly: LocalAssetRecord[] = [];
  const localOnly: LocalAssetRecord[] = [];

  for (const remote of remoteAssets) {
    const local = localByAssetId.get(remote.assetId);
    if (!local) {
      remoteOnly.push(remote);
      toUpsert.push(remote);
      continue;
    }

    if (assetsEquivalent(local, remote)) {
      continue;
    }

    conflicts.push({ assetId: remote.assetId, local, remote });
  }

  for (const local of localAssets) {
    if (!remoteByAssetId.has(local.assetId)) {
      localOnly.push(local);
    }
  }

  return { toUpsert, conflicts, remoteOnly, localOnly };
}

export function applyMergeResolutions(
  plan: LibraryMergePlan,
  resolutions: Map<string, MergeConflictResolution>,
): LocalAssetRecord[] {
  const result = [...plan.toUpsert];

  for (const conflict of plan.conflicts) {
    const resolution = resolutions.get(conflict.assetId) ?? "keep-remote";

    if (resolution === "keep-local") {
      continue;
    }

    if (resolution === "keep-remote") {
      result.push(conflict.remote);
      continue;
    }

    // keep-both: remote wins on metadata, local kept as-is (already in IndexedDB)
    result.push({
      ...conflict.remote,
      id: crypto.randomUUID(),
      name: `${conflict.remote.name} (imported)`,
    });
  }

  return result;
}

function assetsEquivalent(a: LocalAssetRecord, b: LocalAssetRecord): boolean {
  return (
    a.name === b.name &&
    a.folderPath === b.folderPath &&
    a.type === b.type &&
    JSON.stringify(a.tags.slice().sort()) === JSON.stringify(b.tags.slice().sort())
  );
}

/** Union tags when merging metadata from remote onto local. */
export function mergeAssetTags(local: LocalAssetRecord, remote: LocalAssetRecord): string[] {
  return Array.from(new Set([...local.tags, ...remote.tags])).sort();
}
