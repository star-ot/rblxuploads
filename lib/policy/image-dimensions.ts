export interface ImageDimensions {
  width: number;
  height: number;
}

/** Read PNG/JPEG dimensions from a buffer (Node CLI + server). */
export function readImageDimensionsFromBuffer(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 24) {
    return null;
  }

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width > 0 && height > 0) {
      return { width, height };
    }
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        break;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) {
          return { width, height };
        }
        return null;
      }
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength < 2) {
        break;
      }
      offset += 2 + segmentLength;
    }
  }

  return null;
}

/** Load image dimensions in the browser from a File. */
export async function readImageDimensionsFromFile(file: File): Promise<ImageDimensions | null> {
  if (!file.type.startsWith("image/")) {
    return null;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  } catch {
    return null;
  }
}
