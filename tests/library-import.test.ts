import { describe, expect, it } from "vitest";
import {
  normalizeImportedAssets,
  normalizeImportedType,
  parseLibraryImport,
} from "@/lib/library/import";

describe("parseLibraryImport", () => {
  it("parses schema v2 export payloads", () => {
    const payload = {
      schemaVersion: 2,
      exportedAt: "2026-01-01T00:00:00.000Z",
      folders: ["Library/UI"],
      assets: [{ name: "Icon", assetId: "123", type: "Image" }],
    };
    const result = parseLibraryImport(JSON.stringify(payload));
    expect(result.folders).toEqual(["Library/UI"]);
    expect(result.assets).toHaveLength(1);
  });

  it("parses bare asset arrays", () => {
    const result = parseLibraryImport(
      JSON.stringify([{ name: "SFX", assetId: "456", type: "Audio" }]),
    );
    expect(result.assets).toHaveLength(1);
    expect(result.folders).toEqual([]);
  });

  it("parses compact schema v3 manifests", () => {
    const result = parseLibraryImport(
      JSON.stringify({
        sv: 3,
        at: "2026-01-01T00:00:00.000Z",
        f: ["Library"],
        a: [{ c: "chain-1", n: "UI_Icon", t: "Image", i: "123" }],
      }),
    );
    expect(result.format).toBe("compact");
    expect(result.assets[0]?.assetId).toBe("123");
  });
});

describe("normalizeImportedType", () => {
  it("defaults unknown types to Image", () => {
    expect(normalizeImportedType("Unknown")).toBe("Image");
  });

  it("preserves valid asset types", () => {
    expect(normalizeImportedType("Mesh")).toBe("Mesh");
  });
});

describe("normalizeImportedAssets", () => {
  it("filters incomplete records and assigns rbxassetid URIs", () => {
    const normalized = normalizeImportedAssets([
      { name: "Valid", assetId: "999" },
      { name: "", assetId: "000" },
    ]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.assetUri).toBe("rbxassetid://999");
    expect(normalized[0]?.folderPath).toBe("Library");
  });
});
