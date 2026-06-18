import { CONFIG_STORAGE_KEY, DEFAULT_UPLOAD_CONFIG } from "@/lib/config/constants";
import type { UploadConfig } from "@/lib/types";

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
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_UPLOAD_CONFIG;
    }

    const saved = JSON.parse(raw) as Partial<UploadConfig>;
    return {
      ...DEFAULT_UPLOAD_CONFIG,
      ...saved,
    };
  } catch {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    return DEFAULT_UPLOAD_CONFIG;
  }
}

/** Persists non-secret queue tuning + credentials to localStorage only. */
export function saveUploadConfig(config: UploadConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}
