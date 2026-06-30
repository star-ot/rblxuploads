import { describe, expect, it } from "vitest";
import { DEFAULT_UPLOAD_POLICY } from "@/lib/policy/defaults";
import {
  partitionPolicyViolations,
  validateAssetPolicy,
  validateBufferPolicy,
} from "@/lib/policy/validate";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("validateAssetPolicy", () => {
  it("passes when policy is disabled", () => {
    const violations = validateAssetPolicy(
      { fileName: "anything.xyz", displayName: "bad name" },
      { policy: { ...DEFAULT_UPLOAD_POLICY, enabled: false } },
    );
    expect(violations).toHaveLength(0);
  });

  it("rejects unsupported file types", () => {
    const violations = validateAssetPolicy(
      { fileName: "notes.txt", displayName: "Notes" },
      { policy: { ...DEFAULT_UPLOAD_POLICY, enabled: true } },
    );
    expect(violations.some((v) => v.code === "unsupported_type")).toBe(true);
  });

  it("enforces naming pattern on file stem", () => {
    const violations = validateAssetPolicy(
      { fileName: "icon.png", displayName: "Icon" },
      {
        policy: {
          ...DEFAULT_UPLOAD_POLICY,
          enabled: true,
          namingPattern: "^UI_[A-Za-z0-9_]+$",
        },
      },
    );
    expect(violations.some((v) => v.code === "naming_pattern")).toBe(true);
  });

  it("warns on duplicate display names", () => {
    const violations = validateAssetPolicy(
      { fileName: "a.png", displayName: "UI_Icon" },
      {
        policy: { ...DEFAULT_UPLOAD_POLICY, enabled: true, blockOnViolation: false },
        queueNames: ["UI_Icon"],
      },
    );
    const { warnings } = partitionPolicyViolations(violations);
    expect(warnings.some((v) => v.code === "duplicate_name")).toBe(true);
  });
});

describe("validateBufferPolicy", () => {
  it("reads PNG dimensions and enforces min width", () => {
    const violations = validateBufferPolicy("UI_Icon.png", PNG_1X1, {
      policy: {
        ...DEFAULT_UPLOAD_POLICY,
        enabled: true,
        imageMinWidth: 2,
      },
    });
    expect(violations.some((v) => v.code === "image_too_narrow")).toBe(true);
  });
});
