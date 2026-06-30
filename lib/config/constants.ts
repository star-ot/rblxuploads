import type { UploadConfig } from "@/lib/types";
import { DEFAULT_UPLOAD_POLICY, DEFAULT_WEBHOOK_CONFIG } from "@/lib/policy/defaults";

/** localStorage key — bump version when persisted shape changes. */
export const CONFIG_STORAGE_KEY = "starvsk-rblx-uploader-config-v4";

/** Previous key — read once for migration, never written again. */
export const LEGACY_CONFIG_STORAGE_KEY = "starvsk-rblx-uploader-config-v3";

/** Sensible defaults for a fresh install. No secrets are embedded here. */
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  profiles: [],
  activeProfileId: null,
  concurrency: 4,
  maxRetries: 2,
  policy: { ...DEFAULT_UPLOAD_POLICY },
  webhook: { ...DEFAULT_WEBHOOK_CONFIG },
};

/** Roblox Open Cloud is the only external network dependency in this app. */
export const ROBLOX_API_HOST = "apis.roblox.com";
