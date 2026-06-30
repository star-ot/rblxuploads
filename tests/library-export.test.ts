import { describe, expect, it } from "vitest";
import {
  fromCompactExport,
  parseCompactOrFullExport,
  serializeCompactExport,
  toCompactExport,
} from "@/lib/library/export";
import { parseLibraryImport } from "@/lib/library/import";
import type { LocalAssetRecord } from "@/lib/types";

const sampleAsset: LocalAssetRecord = {
  id: "local-1",
  name: "UI_Icon",
  type: "Image",
  assetId: "123",
  assetUri: "rbxassetid://123",
  fileName: "icon.png",
  folderPath: "Library/UI",
  tags: ["ui"],
  createdAt: 1,
  updatedAt: 2,
  versionChainId: "chain-1",
  versions: [{ assetId: "100", replacedAt: 3, fileName: "old.png" }],
};

describe("compact library export", () => {
  it("round-trips assets with version history", () => {
    const compact = toCompactExport([sampleAsset], ["Library/UI"]);
    expect(compact.sv).toBe(3);
    expect(compact.a[0]?.v).toHaveLength(1);

    const restored = fromCompactExport(compact);
    expect(restored.assets[0]?.assetId).toBe("123");
    expect(restored.assets[0]?.versions[0]?.assetId).toBe("100");
  });

  it("serializes without pretty printing by default", () => {
    const compact = toCompactExport([sampleAsset], ["Library"]);
    const raw = serializeCompactExport(compact);
    expect(raw.includes("\n")).toBe(false);
  });

  it("imports compact manifests via parseLibraryImport", () => {
    const compact = toCompactExport([sampleAsset], ["Library/UI"]);
    const parsed = parseLibraryImport(serializeCompactExport(compact));
    expect(parsed.format).toBe("compact");
    expect(parsed.assets[0]?.assetId).toBe("123");
  });

  it("parseCompactOrFullExport handles schema v3", () => {
    const compact = toCompactExport([sampleAsset], ["Library"]);
    const result = parseCompactOrFullExport(serializeCompactExport(compact));
    expect(result.format).toBe("compact");
    expect(result.assets).toHaveLength(1);
  });
});
