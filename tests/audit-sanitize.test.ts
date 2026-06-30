import { describe, expect, it } from "vitest";
import { sanitizeAuditError } from "@/lib/server/audit-sanitize";

describe("sanitizeAuditError", () => {
  it("redacts messages that mention api keys", () => {
    expect(sanitizeAuditError("Invalid apiKey provided in request")).toBe(
      "Roblox API error (redacted)",
    );
  });

  it("redacts authorization bearer patterns", () => {
    expect(sanitizeAuditError("Bearer token expired")).toBe(
      "Roblox API error (redacted)",
    );
  });

  it("truncates long messages", () => {
    const long = "x".repeat(300);
    const result = sanitizeAuditError(long);
    expect(result).toBeDefined();
    expect(result!.length).toBeLessThanOrEqual(241);
    expect(result!.endsWith("…")).toBe(true);
  });

  it("returns undefined for empty input", () => {
    expect(sanitizeAuditError(undefined)).toBeUndefined();
    expect(sanitizeAuditError("")).toBeUndefined();
  });

  it("passes through safe short messages", () => {
    expect(sanitizeAuditError("Creator ID is invalid")).toBe("Creator ID is invalid");
  });
});
