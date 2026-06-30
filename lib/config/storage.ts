import {
  CONFIG_STORAGE_KEY,
  DEFAULT_UPLOAD_CONFIG,
  LEGACY_CONFIG_STORAGE_KEY,
  LEGACY_V3_CONFIG_STORAGE_KEY,
} from "@/lib/config/constants";
import {
  createProfile,
  suggestProfileLabel,
} from "@/lib/config/credentials";
import {
  enableDeviceVault,
  extractSecrets,
  loadVaultSecrets,
  lockVaultSession,
  mergeSecrets,
  saveVaultSecrets,
  stripSecrets,
} from "@/lib/config/credential-vault";
import { DEFAULT_VAULT_SETTINGS } from "@/lib/config/vault-defaults";
import { DEFAULT_UPLOAD_POLICY, DEFAULT_WEBHOOK_CONFIG } from "@/lib/policy/defaults";
import type { CreatorType, CredentialVaultSettings, UploadConfig } from "@/lib/types";

interface LegacyUploadConfig {
  apiKey?: string;
  creatorId?: string;
  creatorType?: CreatorType;
  concurrency?: number;
  maxRetries?: number;
}

export interface LoadUploadConfigResult {
  config: UploadConfig;
  locked: boolean;
}

function isLegacyFormat(data: unknown): data is LegacyUploadConfig {
  if (!data || typeof data !== "object") {
    return false;
  }

  const record = data as Record<string, unknown>;
  return "apiKey" in record && !("profiles" in record);
}

function normalizeVaultSettings(
  saved: Partial<CredentialVaultSettings> | undefined,
): CredentialVaultSettings {
  if (!saved || typeof saved !== "object") {
    return { ...DEFAULT_VAULT_SETTINGS };
  }

  return {
    mode: saved.mode === "passphrase" ? "passphrase" : "device",
    autoLockMinutes:
      typeof saved.autoLockMinutes === "number" && saved.autoLockMinutes >= 0
        ? saved.autoLockMinutes
        : DEFAULT_VAULT_SETTINGS.autoLockMinutes,
    lockOnTabBlur: Boolean(saved.lockOnTabBlur),
    rememberOnDevice: Boolean(saved.rememberOnDevice),
  };
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
    policy: {
      ...DEFAULT_UPLOAD_POLICY,
      ...(saved.policy ?? {}),
    },
    webhook: {
      ...DEFAULT_WEBHOOK_CONFIG,
      ...(saved.webhook ?? {}),
    },
    vault: normalizeVaultSettings(saved.vault),
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
    ...DEFAULT_UPLOAD_CONFIG,
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

function readLocalStorageConfig(): UploadConfig | null {
  const current = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (current) {
    return parseStoredConfig(current);
  }

  const legacyV4 = localStorage.getItem(LEGACY_CONFIG_STORAGE_KEY);
  if (legacyV4) {
    return parseStoredConfig(legacyV4);
  }

  const legacyV3 = localStorage.getItem(LEGACY_V3_CONFIG_STORAGE_KEY);
  if (legacyV3) {
    return parseStoredConfig(legacyV3);
  }

  return null;
}

function hasPlaintextSecrets(config: UploadConfig): boolean {
  if (config.webhook.secret.trim()) {
    return true;
  }

  return config.profiles.some((profile) => profile.apiKey.trim().length > 0);
}

function persistMetadata(config: UploadConfig): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(stripSecrets(config)));
}

async function hydrateSecrets(
  metadata: UploadConfig,
): Promise<LoadUploadConfigResult> {
  const secrets = await loadVaultSecrets(metadata.vault);

  if (!secrets) {
    return {
      config: stripSecrets(metadata),
      locked: metadata.vault.mode === "passphrase",
    };
  }

  return {
    config: mergeSecrets(metadata, secrets),
    locked: false,
  };
}

async function migratePlaintextConfig(
  plaintext: UploadConfig,
): Promise<LoadUploadConfigResult> {
  const metadata = normalizeConfig({
    ...plaintext,
    vault: plaintext.vault ?? DEFAULT_VAULT_SETTINGS,
  });
  const secrets = extractSecrets(plaintext);

  if (metadata.vault.mode === "passphrase") {
    await enableDeviceVault(metadata, secrets);
    metadata.vault = { ...metadata.vault, mode: "device" };
  } else {
    await enableDeviceVault(metadata, secrets);
  }

  persistMetadata(metadata);
  localStorage.removeItem(LEGACY_CONFIG_STORAGE_KEY);
  localStorage.removeItem(LEGACY_V3_CONFIG_STORAGE_KEY);

  return {
    config: mergeSecrets(metadata, secrets),
    locked: false,
  };
}

/**
 * Reads upload settings from browser localStorage and decrypts secrets from IndexedDB.
 * Credentials never touch the server filesystem — only the in-memory API route
 * receives them per-request when you start an upload batch.
 */
export async function loadUploadConfigAsync(): Promise<LoadUploadConfigResult> {
  if (typeof window === "undefined") {
    return { config: DEFAULT_UPLOAD_CONFIG, locked: false };
  }

  try {
    const stored = readLocalStorageConfig();
    if (!stored) {
      return { config: DEFAULT_UPLOAD_CONFIG, locked: false };
    }

    if (hasPlaintextSecrets(stored)) {
      return migratePlaintextConfig(stored);
    }

    return hydrateSecrets(stored);
  } catch {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    lockVaultSession();
    return { config: DEFAULT_UPLOAD_CONFIG, locked: false };
  }
}

/** @deprecated Use loadUploadConfigAsync — sync load cannot decrypt IndexedDB secrets. */
export function loadUploadConfig(): UploadConfig {
  if (typeof window === "undefined") {
    return DEFAULT_UPLOAD_CONFIG;
  }

  try {
    const stored = readLocalStorageConfig();
    return stored ? stripSecrets(stored) : DEFAULT_UPLOAD_CONFIG;
  } catch {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    return DEFAULT_UPLOAD_CONFIG;
  }
}

/** Persists metadata to localStorage and encrypts secrets into IndexedDB. */
export async function saveUploadConfig(config: UploadConfig): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const secrets = extractSecrets(config);
  await saveVaultSecrets(config, secrets);
  persistMetadata(config);
}

export async function unlockUploadConfig(
  metadata: UploadConfig,
  passphrase: string,
): Promise<UploadConfig> {
  const { unlockVaultWithPassphrase } = await import("@/lib/config/credential-vault");
  const secrets = await unlockVaultWithPassphrase(passphrase, metadata.vault);
  return mergeSecrets(metadata, secrets);
}

export function lockUploadConfig(config: UploadConfig): UploadConfig {
  lockVaultSession();
  return stripSecrets(config);
}
