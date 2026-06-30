import { describe, expect, it } from "vitest";
import { resolveUploadActor } from "@/lib/server/actor";
import { withEnv } from "./helpers/env";

describe("resolveUploadActor", () => {
  it("returns undefined when trust proxy is disabled", () => {
    withEnv({ RBLXUPLOADS_TRUST_PROXY: undefined }, () => {
      const request = new Request("http://localhost/api/upload", {
        headers: { "X-Studio-Vault-Actor": "artist@studio.example" },
      });
      expect(resolveUploadActor(request)).toBeUndefined();
    });
  });

  it("prefers X-Studio-Vault-Actor when trust proxy is enabled", () => {
    withEnv({ RBLXUPLOADS_TRUST_PROXY: "1" }, () => {
      const request = new Request("http://localhost/api/upload", {
        headers: {
          "X-Studio-Vault-Actor": "pipeline@studio.example",
          "X-Forwarded-Email": "other@studio.example",
        },
      });
      expect(resolveUploadActor(request)).toBe("pipeline@studio.example");
    });
  });

  it("falls back to X-Forwarded-Email", () => {
    withEnv({ RBLXUPLOADS_TRUST_PROXY: "1" }, () => {
      const request = new Request("http://localhost/api/upload", {
        headers: { "X-Forwarded-Email": "dev@studio.example" },
      });
      expect(resolveUploadActor(request)).toBe("dev@studio.example");
    });
  });

  it("truncates very long actor values", () => {
    withEnv({ RBLXUPLOADS_TRUST_PROXY: "1" }, () => {
      const long = "a".repeat(250);
      const request = new Request("http://localhost/api/upload", {
        headers: { "X-Studio-Vault-Actor": long },
      });
      const actor = resolveUploadActor(request);
      expect(actor).toBeDefined();
      expect(actor!.length).toBe(201);
      expect(actor!.endsWith("…")).toBe(true);
    });
  });
});
