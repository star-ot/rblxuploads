import type { CredentialProfile, UploadConfig } from "@/lib/types";

export interface ProfileMetadataExport {
  schemaVersion: 1;
  exportedAt: string;
  profiles: Array<{
    id: string;
    label: string;
    creatorId: string;
    creatorType: CredentialProfile["creatorType"];
    apiKey?: string;
  }>;
  activeProfileId: string | null;
}

export function exportProfileMetadata(
  config: UploadConfig,
  options: { includeApiKeys?: boolean } = {},
): ProfileMetadataExport {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    activeProfileId: config.activeProfileId,
    profiles: config.profiles.map((profile) => {
      const entry = {
        id: profile.id,
        label: profile.label,
        creatorId: profile.creatorId,
        creatorType: profile.creatorType,
      };

      if (options.includeApiKeys && profile.apiKey.trim()) {
        return { ...entry, apiKey: profile.apiKey };
      }

      return entry;
    }),
  };
}

export function importProfileMetadata(
  config: UploadConfig,
  payload: ProfileMetadataExport,
  options: { merge?: boolean } = {},
): UploadConfig {
  const importedProfiles: CredentialProfile[] = payload.profiles.map((entry) => ({
    id: entry.id || crypto.randomUUID(),
    label: entry.label,
    apiKey: entry.apiKey ?? "",
    creatorId: entry.creatorId,
    creatorType: entry.creatorType,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  if (!options.merge) {
    return {
      ...config,
      profiles: importedProfiles,
      activeProfileId: payload.activeProfileId ?? importedProfiles[0]?.id ?? null,
    };
  }

  const byId = new Map(config.profiles.map((p) => [p.id, p]));
  for (const profile of importedProfiles) {
    const existing = byId.get(profile.id);
    byId.set(profile.id, existing ? { ...existing, ...profile, apiKey: profile.apiKey || existing.apiKey } : profile);
  }

  return {
    ...config,
    profiles: Array.from(byId.values()),
    activeProfileId: payload.activeProfileId ?? config.activeProfileId,
  };
}
