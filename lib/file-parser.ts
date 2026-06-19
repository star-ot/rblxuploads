import type { AssetType } from "@/lib/types";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "ogg", "wav", "flac"]);

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/flac",
  "audio/x-flac",
  "audio/x-wav",
]);

export function getAssetType(file: File): AssetType | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type.toLowerCase();

  if (IMAGE_EXTENSIONS.has(extension) || IMAGE_MIME_TYPES.has(mime)) {
    return "Image";
  }

  if (AUDIO_EXTENSIONS.has(extension) || AUDIO_MIME_TYPES.has(mime)) {
    return "Audio";
  }

  return null;
}

export function isSupportedAssetFile(file: File): boolean {
  return getAssetType(file) !== null;
}

export function getUnsupportedReason(file: File): string {
  if (!isSupportedAssetFile(file)) {
    return "Unsupported file type. Use PNG, JPG, JPEG, WEBP, MP3, OGG, WAV, or FLAC.";
  }

  return "";
}
