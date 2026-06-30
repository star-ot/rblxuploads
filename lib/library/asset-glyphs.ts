import type { AssetType } from "@/lib/types";

export function getAssetTypeGlyph(type: AssetType): string {
  switch (type) {
    case "Audio":
      return "A";
    case "Model":
      return "M";
    case "Mesh":
      return "X";
    case "Image":
    default:
      return "I";
  }
}
