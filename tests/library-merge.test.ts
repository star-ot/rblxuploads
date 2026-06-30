import { describe, expect, it } from "vitest";
import {
  applyMergeResolutions,
  planLibraryMerge,
} from "@/lib/library/merge";
import type { LocalAssetRecord } from "@/lib/types";

function asset(
  partial: Pick<LocalAssetRecord, "assetId" | "name"> & Partial<LocalAssetRecord>,
): LocalAssetRecord {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    type: partial.type ?? "Image",
    assetId: partial.assetId,
    assetUri: partial.assetUri ?? `rbxassetid://${partial.assetId}`,
    fileName: partial.fileName ?? `${partial.name}.png`,
    folderPath: partial.folderPath ?? "Library",
    tags: partial.tags ?? [],
    createdAt: partial.createdAt ?? 1,
    updatedAt: partial.updatedAt ?? 1,
  };
}

describe("planLibraryMerge", () => {
  it("treats remote-only assets as upserts", () => {
    const local: LocalAssetRecord[] = [];
    const remote = [asset({ assetId: "111", name: "Icon" })];
    const plan = planLibraryMerge(local, remote);
    expect(plan.remoteOnly).toHaveLength(1);
    expect(plan.toUpsert).toHaveLength(1);
    expect(plan.conflicts).toHaveLength(0);
  });

  it("detects conflicts when metadata differs", () => {
    const local = [asset({ assetId: "111", name: "LocalName" })];
    const remote = [asset({ assetId: "111", name: "RemoteName" })];
    const plan = planLibraryMerge(local, remote);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.toUpsert).toHaveLength(0);
  });

  it("skips equivalent assets", () => {
    const record = asset({ assetId: "111", name: "Same" });
    const plan = planLibraryMerge([record], [{ ...record, id: "other-id" }]);
    expect(plan.conflicts).toHaveLength(0);
    expect(plan.toUpsert).toHaveLength(0);
  });
});

describe("applyMergeResolutions", () => {
  it("applies keep-remote by default for conflicts", () => {
    const local = [asset({ assetId: "111", name: "Local" })];
    const remote = [asset({ assetId: "111", name: "Remote" })];
    const plan = planLibraryMerge(local, remote);
    const merged = applyMergeResolutions(plan, new Map());
    expect(merged.some((entry) => entry.name === "Remote")).toBe(true);
  });

  it("keeps both with renamed import when requested", () => {
    const local = [asset({ assetId: "111", name: "Local" })];
    const remote = [asset({ assetId: "111", name: "Remote" })];
    const plan = planLibraryMerge(local, remote);
    const merged = applyMergeResolutions(
      plan,
      new Map([["111", "keep-both"]]),
    );
    expect(merged.some((entry) => entry.name === "Remote (imported)")).toBe(true);
  });
});
