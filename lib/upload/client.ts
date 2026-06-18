import type { UploadApiResponse, UploadConfig, UploadQueueItem } from "@/lib/types";

interface UploadClientOptions {
  item: UploadQueueItem;
  config: UploadConfig;
}

/**
 * Sends one image to the local /api/upload proxy.
 * The API key travels only to your own Next.js server, which forwards it to Roblox.
 */
export async function uploadImageAsset({
  item,
  config,
}: UploadClientOptions): Promise<UploadApiResponse> {
  const formData = new FormData();
  formData.append("file", item.file);
  formData.append("displayName", item.assetName);
  formData.append("creatorId", config.creatorId.trim());
  formData.append("creatorType", config.creatorType);
  formData.append("apiKey", config.apiKey.trim());

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
