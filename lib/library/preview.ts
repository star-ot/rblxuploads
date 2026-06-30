const LIBRARY_PREVIEW_MAX = 96;
const LIBRARY_PREVIEW_QUALITY = 0.78;

/** Small WebP preview for compact exports and version history. */
export async function createOptimizedPreview(file: File): Promise<string | undefined> {
  if (!file.type.startsWith("image/")) {
    return undefined;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    if (!Number.isFinite(longest) || longest <= 0) {
      bitmap.close();
      return undefined;
    }

    const scale = Math.min(1, LIBRARY_PREVIEW_MAX / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return undefined;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvas.toDataURL("image/webp", LIBRARY_PREVIEW_QUALITY);
  } catch {
    return undefined;
  }
}
