import type { UploadConfig } from "@/lib/types";

/** localStorage key — bump version when persisted shape changes. */
export const CONFIG_STORAGE_KEY = "starvsk-rblx-uploader-config-v2";

/** Sensible defaults for a fresh install. No secrets are embedded here. */
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  apiKey: "",
  creatorId: "",
  creatorType: "user",
  concurrency: 4,
  maxRetries: 2,
};

/** Roblox Open Cloud is the only external network dependency in this app. */
export const ROBLOX_API_HOST = "apis.roblox.com";
