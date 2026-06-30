import { describe, expect, it } from "vitest";
import { translateUploadError } from "@/lib/roblox/error-messages";

describe("translateUploadError", () => {
  it("maps unauthorized errors to asset scope guidance", () => {
    expect(translateUploadError("Invalid or unauthorized Roblox Open Cloud API key.")).toContain(
      "asset permission scope",
    );
  });

  it("maps rate limit errors", () => {
    expect(translateUploadError("Roblox rate limit reached")).toContain("rate limit");
  });

  it("maps missing api key errors", () => {
    expect(translateUploadError("Missing API key")).toContain("Settings");
  });

  it("passes through unsupported file messages", () => {
    const message = "Unsupported file type. Use PNG.";
    expect(translateUploadError(message)).toBe(message);
  });
});
