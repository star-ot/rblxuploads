import { describe, expect, it } from "vitest";
import {
  getAssetVersionOptions,
  getVersionCount,
  normalizeAssetVersions,
  replaceAssetVersion,
} from "@/lib/library/versioning";
import type { LocalAssetRecord } from "@/lib/types";

const baseAsset: LocalAssetRecord = {
  id: "a1",
  name: "UI_Icon",
  type: "Image",
  assetId: "111",
  assetUri: "rbxassetid://111",
  fileName: "icon.png",
  folderPath: "Library",
  tags: [],
  createdAt: 1,
  updatedAt: 1,
  versionChainId: "chain-1",
  versions: [],
};

describe("library versioning", () => {
  it("normalizes legacy records without version fields", () => {
    const normalized = normalizeAssetVersions({
      ...baseAsset,
      versionChainId: undefined,
      versions: undefined,
    });
    expect(normalized.versionChainId).toBeTruthy();
    expect(normalized.versions).toEqual([]);
  });

  it("archives prior rbxassetid on replace", () => {
    const next = replaceAssetVersion(baseAsset, {
      assetId: "222",
      fileName: "icon_v2.png",
    });
    expect(next.assetId).toBe("222");
    expect(next.versions).toHaveLength(1);
    expect(next.versions[0]?.assetId).toBe("111");
    expect(getVersionCount(next)).toBe(2);
  });

  it("archives thumbnail preview with prior version", () => {
    const withThumb = { ...baseAsset, thumbnailDataUrl: "data:image/webp;base64,abc" };
    const next = replaceAssetVersion(withThumb, {
      assetId: "222",
      fileName: "icon_v2.png",
      thumbnailDataUrl: "data:image/webp;base64,new",
    });
    expect(next.versions[0]?.thumbnailDataUrl).toBe("data:image/webp;base64,abc");
    expect(next.thumbnailDataUrl).toBe("data:image/webp;base64,new");
  });
});

describe("getAssetVersionOptions", () => {
  it("lists current first then prior versions newest-first", () => {
    const asset = replaceAssetVersion(baseAsset, { assetId: "222", fileName: "v2.png" });
    const options = getAssetVersionOptions(asset);
    expect(options[0]?.isCurrent).toBe(true);
    expect(options[0]?.assetId).toBe("222");
    expect(options[1]?.assetId).toBe("111");
    expect(options[1]?.label).toMatch(/^v\d+$/);
  });
});
