"use client";

import type { CredentialVaultMode, CredentialVaultSettings, UploadConfig } from "@/lib/types";

export const VAULT_DB_NAME = "rblxuploads-credential-vault";
export const VAULT_DB_VERSION = 1;
export const VAULT_SECRETS_ID = "secrets";
export const VAULT_DEVICE_KEY_ID = "master";
export const VAULT_WRAPPED_KEY_ID = "wrapped-passphrase";

export const PBKDF2_ITERATIONS = 100_000;
const IV_BYTES = 12;
const SALT_BYTES = 16;
const DEVICE_KEY_BYTES = 32;

export interface VaultSecrets {
  profileKeys: Record<string, string>;
  webhookSecret: string;
}

interface VaultBlobRecord {
  id: typeof VAULT_SECRETS_ID;
  mode: CredentialVaultMode;
  salt: string;
  iv: string;
  ciphertext: string;
}

interface DeviceKeyRecord {
  id: typeof VAULT_DEVICE_KEY_ID;
  key: string;
}

interface WrappedKeyRecord {
  id: typeof VAULT_WRAPPED_KEY_ID;
  iv: string;
  wrappedKey: string;
}

let sessionUnlockKey: CryptoKey | null = null;

function getSubtle(): SubtleCrypto {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Web Crypto is not available in this environment.");
  }
  return crypto.subtle;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return getSubtle().importKey("raw", toArrayBuffer(rawKey), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const baseKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function exportRawKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = await getSubtle().exportKey("raw", key);
  return new Uint8Array(raw);
}

function openVaultDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VAULT_DB_NAME, VAULT_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("vault")) {
        db.createObjectStore("vault", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("device")) {
        db.createObjectStore("device", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed opening credential vault database."));
  });
}

async function readStoreRecord<T extends { id: string }>(
  storeName: "vault" | "device",
  id: string,
): Promise<T | null> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(id);

    request.onsuccess = () => {
      resolve((request.result as T | undefined) ?? null);
    };
    request.onerror = () => {
      reject(request.error ?? new Error(`Failed reading ${storeName}/${id}.`));
    };

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error(`Failed reading ${storeName}/${id}.`));
    };
  });
}

async function writeStoreRecord<T extends { id: string }>(
  storeName: "vault" | "device",
  record: T,
): Promise<void> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      reject(request.error ?? new Error(`Failed writing ${storeName}/${record.id}.`));
    };

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error(`Failed writing ${storeName}/${record.id}.`));
    };
  });
}

async function deleteStoreRecord(
  storeName: "vault" | "device",
  id: string,
): Promise<void> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      reject(request.error ?? new Error(`Failed deleting ${storeName}/${id}.`));
    };

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error(`Failed deleting ${storeName}/${id}.`));
    };
  });
}

export function extractSecrets(config: UploadConfig): VaultSecrets {
  return {
    profileKeys: Object.fromEntries(
      config.profiles.map((profile) => [profile.id, profile.apiKey]),
    ),
    webhookSecret: config.webhook.secret,
  };
}

export function stripSecrets(config: UploadConfig): UploadConfig {
  return {
    ...config,
    profiles: config.profiles.map((profile) => ({ ...profile, apiKey: "" })),
    webhook: { ...config.webhook, secret: "" },
  };
}

export function mergeSecrets(
  config: UploadConfig,
  secrets: VaultSecrets,
): UploadConfig {
  return {
    ...config,
    profiles: config.profiles.map((profile) => ({
      ...profile,
      apiKey: secrets.profileKeys[profile.id] ?? "",
    })),
    webhook: {
      ...config.webhook,
      secret: secrets.webhookSecret,
    },
  };
}

export function isVaultSessionUnlocked(): boolean {
  return sessionUnlockKey !== null;
}

export function lockVaultSession(): void {
  sessionUnlockKey = null;
}

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const existing = await readStoreRecord<DeviceKeyRecord>("device", VAULT_DEVICE_KEY_ID);
  if (existing?.key) {
    return importAesKey(base64ToBytes(existing.key));
  }

  const rawKey = randomBytes(DEVICE_KEY_BYTES);
  await writeStoreRecord<DeviceKeyRecord>("device", {
    id: VAULT_DEVICE_KEY_ID,
    key: bytesToBase64(rawKey),
  });
  return importAesKey(rawKey);
}

async function encryptSecretsPayload(
  secrets: VaultSecrets,
  key: CryptoKey,
): Promise<{ iv: string; ciphertext: string }> {
  const iv = randomBytes(IV_BYTES);
  const plaintext = new TextEncoder().encode(JSON.stringify(secrets));
  const ciphertext = await getSubtle().encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    plaintext,
  );

  return {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

async function decryptSecretsPayload(
  iv: string,
  ciphertext: string,
  key: CryptoKey,
): Promise<VaultSecrets> {
  const plaintext = await getSubtle().decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(iv)) },
    key,
    toArrayBuffer(base64ToBytes(ciphertext)),
  );

  const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as VaultSecrets;
  return {
    profileKeys: parsed.profileKeys ?? {},
    webhookSecret: parsed.webhookSecret ?? "",
  };
}

async function saveWrappedPassphraseKey(
  passphraseKey: CryptoKey,
  rememberOnDevice: boolean,
): Promise<void> {
  if (!rememberOnDevice) {
    await deleteStoreRecord("device", VAULT_WRAPPED_KEY_ID);
    return;
  }

  const deviceKey = await getOrCreateDeviceKey();
  const rawPassphraseKey = await exportRawKey(passphraseKey);
  const iv = randomBytes(IV_BYTES);
  const wrapped = await getSubtle().encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    deviceKey,
    toArrayBuffer(rawPassphraseKey),
  );

  await writeStoreRecord<WrappedKeyRecord>("device", {
    id: VAULT_WRAPPED_KEY_ID,
    iv: bytesToBase64(iv),
    wrappedKey: bytesToBase64(new Uint8Array(wrapped)),
  });
}

async function loadWrappedPassphraseKey(): Promise<CryptoKey | null> {
  const wrapped = await readStoreRecord<WrappedKeyRecord>("device", VAULT_WRAPPED_KEY_ID);
  if (!wrapped) {
    return null;
  }

  const deviceKey = await getOrCreateDeviceKey();
  const raw = await getSubtle().decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(wrapped.iv)) },
    deviceKey,
    toArrayBuffer(base64ToBytes(wrapped.wrappedKey)),
  );

  return importAesKey(new Uint8Array(raw));
}

export async function saveVaultSecrets(
  config: UploadConfig,
  secrets: VaultSecrets,
): Promise<void> {
  const mode = config.vault.mode;
  const existing = await readStoreRecord<VaultBlobRecord>("vault", VAULT_SECRETS_ID);
  let encryptionKey: CryptoKey;
  let salt: string;

  if (mode === "device") {
    encryptionKey = await getOrCreateDeviceKey();
    sessionUnlockKey = null;
    await deleteStoreRecord("device", VAULT_WRAPPED_KEY_ID);
    salt = existing?.salt ?? bytesToBase64(randomBytes(SALT_BYTES));
  } else {
    if (!sessionUnlockKey) {
      throw new Error("Credential vault is locked.");
    }
    encryptionKey = sessionUnlockKey;
    salt = existing?.salt ?? bytesToBase64(randomBytes(SALT_BYTES));
    await saveWrappedPassphraseKey(encryptionKey, config.vault.rememberOnDevice);
  }

  const encrypted = await encryptSecretsPayload(secrets, encryptionKey);
  await writeStoreRecord<VaultBlobRecord>("vault", {
    id: VAULT_SECRETS_ID,
    mode,
    salt,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
  });
}

export async function loadVaultSecrets(
  settings: CredentialVaultSettings,
): Promise<VaultSecrets | null> {
  const blob = await readStoreRecord<VaultBlobRecord>("vault", VAULT_SECRETS_ID);
  if (!blob) {
    return { profileKeys: {}, webhookSecret: "" };
  }

  if (settings.mode === "device") {
    const deviceKey = await getOrCreateDeviceKey();
    return decryptSecretsPayload(blob.iv, blob.ciphertext, deviceKey);
  }

  let unlockKey = sessionUnlockKey;
  if (!unlockKey && settings.rememberOnDevice) {
    unlockKey = await loadWrappedPassphraseKey();
    if (unlockKey) {
      sessionUnlockKey = unlockKey;
    }
  }

  if (!unlockKey) {
    return null;
  }

  return decryptSecretsPayload(blob.iv, blob.ciphertext, unlockKey);
}

export async function unlockVaultWithPassphrase(
  passphrase: string,
  settings: CredentialVaultSettings,
): Promise<VaultSecrets> {
  const blob = await readStoreRecord<VaultBlobRecord>("vault", VAULT_SECRETS_ID);
  if (!blob) {
    sessionUnlockKey = null;
    return { profileKeys: {}, webhookSecret: "" };
  }

  const derivedKey = await deriveKeyFromPassphrase(
    passphrase,
    base64ToBytes(blob.salt),
  );

  try {
    const secrets = await decryptSecretsPayload(
      blob.iv,
      blob.ciphertext,
      derivedKey,
    );
    sessionUnlockKey = derivedKey;
    await saveWrappedPassphraseKey(derivedKey, settings.rememberOnDevice);
    return secrets;
  } catch {
    throw new Error("Incorrect vault passphrase.");
  }
}

export async function enablePassphraseVault(
  config: UploadConfig,
  secrets: VaultSecrets,
  passphrase: string,
): Promise<void> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);
  const encrypted = await encryptSecretsPayload(secrets, derivedKey);

  sessionUnlockKey = derivedKey;
  await writeStoreRecord<VaultBlobRecord>("vault", {
    id: VAULT_SECRETS_ID,
    mode: "passphrase",
    salt: bytesToBase64(salt),
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
  });
  await saveWrappedPassphraseKey(derivedKey, config.vault.rememberOnDevice);
}

export async function enableDeviceVault(
  config: UploadConfig,
  secrets: VaultSecrets,
): Promise<void> {
  const deviceKey = await getOrCreateDeviceKey();
  const encrypted = await encryptSecretsPayload(secrets, deviceKey);

  sessionUnlockKey = null;
  await deleteStoreRecord("device", VAULT_WRAPPED_KEY_ID);
  await writeStoreRecord<VaultBlobRecord>("vault", {
    id: VAULT_SECRETS_ID,
    mode: "device",
    salt: bytesToBase64(randomBytes(SALT_BYTES)),
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
  });
}

export async function changeVaultPassphrase(
  config: UploadConfig,
  secrets: VaultSecrets,
  currentPassphrase: string,
  nextPassphrase: string,
): Promise<void> {
  await unlockVaultWithPassphrase(currentPassphrase, config.vault);
  lockVaultSession();
  await enablePassphraseVault(
    { ...config, vault: { ...config.vault, mode: "passphrase" } },
    secrets,
    nextPassphrase,
  );
}
