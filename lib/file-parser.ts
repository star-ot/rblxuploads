const SUPPORTED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
const SUPPORTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export function isSupportedImageFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  return (
    SUPPORTED_EXTENSIONS.has(extension) || SUPPORTED_MIME_TYPES.has(file.type)
  );
}

export function getUnsupportedReason(file: File): string {
  if (!isSupportedImageFile(file)) {
    return "Unsupported image type. Use PNG, JPG, JPEG, or WEBP.";
  }

  return "";
}
