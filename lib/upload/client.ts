import { resolveUploadCredentials } from "@/lib/config/credentials";
import type { UploadApiResponse, UploadConfig, UploadQueueItem } from "@/lib/types";

interface UploadClientOptions {
  item: UploadQueueItem;
  config: UploadConfig;
}

/**
 * Sends one asset to the local /api/upload proxy.
 * The API key travels only to your own Next.js server, which forwards it to Roblox.
 */
export async function uploadAsset({
  item,
  config,
}: UploadClientOptions): Promise<UploadApiResponse> {
  const credentials = resolveUploadCredentials(config);
  if (!credentials) {
    return {
      ok: false,
      error: "Active credential profile is incomplete.",
    };
  }

  const formData = new FormData();
  formData.append("file", item.file);
  formData.append("assetType", item.assetType);
  formData.append("displayName", item.assetName);
  formData.append("creatorId", credentials.creatorId);
  formData.append("creatorType", credentials.creatorType);
  formData.append("apiKey", credentials.apiKey);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as UploadApiResponse;

  if (!response.ok || !payload.ok) {
    return {
      ok: false,
      error: payload.error ?? "Upload failed",
    };
  }

  return payload;
}

interface UpdateModelPackageOptions {
  file: File;
  assetId: string;
  displayName: string;
  config: UploadConfig;
}

export async function updateModelPackage({
  file,
  assetId,
  displayName,
  config,
}: UpdateModelPackageOptions): Promise<UploadApiResponse> {
  const credentials = resolveUploadCredentials(config);
  if (!credentials) {
    return {
      ok: false,
      error: "Active credential profile is incomplete.",
    };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("assetId", assetId.trim());
  formData.append("displayName", displayName.trim());
  formData.append("creatorId", credentials.creatorId);
  formData.append("creatorType", credentials.creatorType);
  formData.append("apiKey", credentials.apiKey);

  const response = await fetch("/api/upload", {
    method: "PATCH",
    body: formData,
  });

  const payload = (await response.json()) as UploadApiResponse;

  if (!response.ok || !payload.ok) {
    return {
      ok: false,
      error: payload.error ?? "Model package update failed",
    };
  }

  return payload;
}
