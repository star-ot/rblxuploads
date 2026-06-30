import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateDirectory } from "@/lib/policy/cli-validate";
import { DEFAULT_UPLOAD_POLICY } from "@/lib/policy/defaults";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const validDir = join(root, "fixtures/ci-assets");
const invalidDir = join(root, "fixtures/policy-violations");

describe("validateDirectory", () => {
  it("passes valid CI fixture assets with UI naming pattern", () => {
    const result = validateDirectory(validDir, {
      ...DEFAULT_UPLOAD_POLICY,
      enabled: true,
      namingPattern: "^UI_[A-Za-z0-9_]+$",
      blockOnViolation: true,
    });
    expect(result.filesChecked).toBeGreaterThan(0);
    expect(result.ok).toBe(true);
  });

  it("fails when naming pattern is violated", () => {
    const result = validateDirectory(invalidDir, {
      ...DEFAULT_UPLOAD_POLICY,
      enabled: true,
      namingPattern: "^UI_[A-Za-z0-9_]+$",
    });
    const hasNamingError = result.violations.some((v) => v.code === "naming_pattern");
    expect(hasNamingError).toBe(true);
    expect(result.ok).toBe(false);
  });
});
