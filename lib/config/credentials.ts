import type {
  CredentialProfile,
  CreatorType,
  UploadConfig,
  UploadCredentials,
} from "@/lib/types";

export const MAX_CREDENTIAL_PROFILES = 25;

export function createProfile(
  partial?: Partial<Omit<CredentialProfile, "id" | "createdAt" | "updatedAt">>,
): CredentialProfile {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    label: partial?.label ?? "New profile",
    apiKey: partial?.apiKey ?? "",
    creatorId: partial?.creatorId ?? "",
    creatorType: partial?.creatorType ?? "user",
    createdAt: now,
    updatedAt: now,
  };
}

export function suggestProfileLabel(
  creatorType: CreatorType,
  creatorId: string,
): string {
  const trimmedId = creatorId.trim();
  if (!trimmedId) {
    return creatorType === "group" ? "Group" : "User";
  }

  return creatorType === "group" ? `Group ${trimmedId}` : `User ${trimmedId}`;
}

export function getProfileDisplayName(profile: CredentialProfile): string {
  const label = profile.label.trim();
  if (label) {
    return label;
  }

  return suggestProfileLabel(profile.creatorType, profile.creatorId);
}

export function getActiveProfile(
  config: UploadConfig,
): CredentialProfile | null {
  if (!config.activeProfileId) {
    return config.profiles[0] ?? null;
  }

  return (
    config.profiles.find((profile) => profile.id === config.activeProfileId) ??
    config.profiles[0] ??
    null
  );
}

export function isProfileReady(profile: CredentialProfile): boolean {
  return (
    profile.apiKey.trim().length > 0 &&
    profile.creatorId.trim().length > 0 &&
    /^\d+$/.test(profile.creatorId.trim())
  );
}

export function resolveUploadCredentials(
  config: UploadConfig,
): UploadCredentials | null {
  const profile = getActiveProfile(config);
  if (!profile || !isProfileReady(profile)) {
    return null;
  }

  return {
    apiKey: profile.apiKey.trim(),
    creatorId: profile.creatorId.trim(),
    creatorType: profile.creatorType,
  };
}

export function validateActiveProfile(config: UploadConfig): string | null {
  if (config.profiles.length === 0) {
    return "Add at least one credential profile in Settings before uploading.";
  }

  const profile = getActiveProfile(config);
  if (!profile) {
    return "Select a credential profile in Settings before uploading.";
  }

  if (!profile.apiKey.trim()) {
    return `Add an API key to "${getProfileDisplayName(profile)}" in Settings.`;
  }

  if (!profile.creatorId.trim() || !/^\d+$/.test(profile.creatorId.trim())) {
    return `Creator ID for "${getProfileDisplayName(profile)}" must be a numeric Roblox user or group ID.`;
  }

  return null;
}

export function setActiveProfileId(
  config: UploadConfig,
  profileId: string,
): UploadConfig {
  if (!config.profiles.some((profile) => profile.id === profileId)) {
    return config;
  }

  return {
    ...config,
    activeProfileId: profileId,
  };
}

export function upsertProfile(
  config: UploadConfig,
  profile: CredentialProfile,
): UploadConfig {
  const exists = config.profiles.some((entry) => entry.id === profile.id);
  const profiles = exists
    ? config.profiles.map((entry) =>
        entry.id === profile.id
          ? { ...profile, updatedAt: Date.now() }
          : entry,
      )
    : [...config.profiles, { ...profile, updatedAt: Date.now() }];

  return {
    ...config,
    profiles,
    activeProfileId: config.activeProfileId ?? profile.id,
  };
}

export function addProfile(config: UploadConfig): UploadConfig {
  if (config.profiles.length >= MAX_CREDENTIAL_PROFILES) {
    return config;
  }

  const profile = createProfile();
  return {
    ...config,
    profiles: [...config.profiles, profile],
    activeProfileId: profile.id,
  };
}

export function removeProfile(
  config: UploadConfig,
  profileId: string,
): UploadConfig {
  const profiles = config.profiles.filter((profile) => profile.id !== profileId);
  const activeStillExists = profiles.some(
    (profile) => profile.id === config.activeProfileId,
  );

  return {
    ...config,
    profiles,
    activeProfileId: activeStillExists
      ? config.activeProfileId
      : (profiles[0]?.id ?? null),
  };
}

export function duplicateProfile(
  config: UploadConfig,
  profileId: string,
): UploadConfig {
  if (config.profiles.length >= MAX_CREDENTIAL_PROFILES) {
    return config;
  }

  const source = config.profiles.find((profile) => profile.id === profileId);
  if (!source) {
    return config;
  }

  const copy = createProfile({
    label: `${getProfileDisplayName(source)} (copy)`,
    apiKey: source.apiKey,
    creatorId: source.creatorId,
    creatorType: source.creatorType,
  });

  return {
    ...config,
    profiles: [...config.profiles, copy],
    activeProfileId: copy.id,
  };
}

export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return "No key saved";
  }

  if (trimmed.length <= 8) {
    return "••••••••";
  }

  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}
