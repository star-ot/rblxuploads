import {
  CONFIG_STORAGE_KEY,
  DEFAULT_UPLOAD_CONFIG,
  LEGACY_CONFIG_STORAGE_KEY,
} from "@/lib/config/constants";
import {
  createProfile,
  suggestProfileLabel,
} from "@/lib/config/credentials";
import type { CreatorType, UploadConfig } from "@/lib/types";

interface LegacyUploadConfig {
  apiKey?: string;
  creatorId?: string;
  creatorType?: CreatorType;
  concurrency?: number;
  maxRetries?: number;
}

function isLegacyFormat(data: unknown): data is LegacyUploadConfig {
  if (!data || typeof data !== "object") {
    return false;
  }

  const record = data as Record<string, unknown>;
  return "apiKey" in record && !("profiles" in record);
}

function normalizeConfig(saved: Partial<UploadConfig>): UploadConfig {
  const profiles = Array.isArray(saved.profiles) ? saved.profiles : [];
  const activeProfileId =
    typeof saved.activeProfileId === "string" ? saved.activeProfileId : null;
  const activeExists = profiles.some((profile) => profile.id === activeProfileId);

  return {
    profiles,
    activeProfileId: activeExists
      ? activeProfileId
      : (profiles[0]?.id ?? null),
    concurrency:
      typeof saved.concurrency === "number"
        ? saved.concurrency
        : DEFAULT_UPLOAD_CONFIG.concurrency,
    maxRetries:
      typeof saved.maxRetries === "number"
        ? saved.maxRetries
        : DEFAULT_UPLOAD_CONFIG.maxRetries,
  };
}

function migrateLegacyConfig(legacy: LegacyUploadConfig): UploadConfig {
  const hasCredentials =
    Boolean(legacy.apiKey?.trim()) || Boolean(legacy.creatorId?.trim());

  if (!hasCredentials) {
    return {
      ...DEFAULT_UPLOAD_CONFIG,
      concurrency: legacy.concurrency ?? DEFAULT_UPLOAD_CONFIG.concurrency,
      maxRetries: legacy.maxRetries ?? DEFAULT_UPLOAD_CONFIG.maxRetries,
    };
  }

  const creatorType = legacy.creatorType ?? "user";
  const creatorId = legacy.creatorId ?? "";
  const profile = createProfile({
    label: suggestProfileLabel(creatorType, creatorId),
    apiKey: legacy.apiKey ?? "",
    creatorId,
    creatorType,
  });

  return {
    profiles: [profile],
    activeProfileId: profile.id,
    concurrency: legacy.concurrency ?? DEFAULT_UPLOAD_CONFIG.concurrency,
    maxRetries: legacy.maxRetries ?? DEFAULT_UPLOAD_CONFIG.maxRetries,
  };
}

function parseStoredConfig(raw: string): UploadConfig {
  const parsed = JSON.parse(raw) as unknown;

  if (isLegacyFormat(parsed)) {
    return migrateLegacyConfig(parsed);
  }

  return normalizeConfig(parsed as Partial<UploadConfig>);
}

/**
 * Reads upload settings from browser localStorage.
 * Credentials never touch the server filesystem — only the in-memory API route
 * receives them per-request when you start an upload batch.
 */
export function loadUploadConfig(): UploadConfig {
  if (typeof window === "undefined") {
    return DEFAULT_UPLOAD_CONFIG;
  }

  try {
    const current = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (current) {
      return parseStoredConfig(current);
    }

    const legacy = localStorage.getItem(LEGACY_CONFIG_STORAGE_KEY);
    if (legacy) {
      const migrated = parseStoredConfig(legacy);
      saveUploadConfig(migrated);
      return migrated;
    }

    return DEFAULT_UPLOAD_CONFIG;
  } catch {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    return DEFAULT_UPLOAD_CONFIG;
  }
}

/** Persists queue tuning + credential profiles to localStorage only. */
export function saveUploadConfig(config: UploadConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}
