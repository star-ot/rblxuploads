import { describe, expect, it } from "vitest";
import {
  getAllowedOrigins,
  getServerWebhookUrl,
  isAuditLogEnabled,
  isMetricsPublic,
  isTrustProxyEnabled,
} from "@/lib/server/config";
import { withEnv } from "./helpers/env";

describe("server config", () => {
  it("reads audit log flag", () => {
    withEnv({ RBLXUPLOADS_AUDIT_LOG: "1" }, () => {
      expect(isAuditLogEnabled()).toBe(true);
    });
    withEnv({ RBLXUPLOADS_AUDIT_LOG: "0" }, () => {
      expect(isAuditLogEnabled()).toBe(false);
    });
  });

  it("reads trust proxy flag", () => {
    withEnv({ RBLXUPLOADS_TRUST_PROXY: "1" }, () => {
      expect(isTrustProxyEnabled()).toBe(true);
    });
  });

  it("parses allowed origins list", () => {
    withEnv(
      { RBLXUPLOADS_ALLOWED_ORIGINS: "https://a.test, https://b.test" },
      () => {
        expect(getAllowedOrigins()).toEqual(["https://a.test", "https://b.test"]);
      },
    );
    withEnv({ RBLXUPLOADS_ALLOWED_ORIGINS: undefined }, () => {
      expect(getAllowedOrigins()).toBeNull();
    });
  });

  it("reads webhook and metrics env", () => {
    withEnv(
      {
        RBLXUPLOADS_WEBHOOK_URL: "https://hooks.example.com",
        RBLXUPLOADS_METRICS_PUBLIC: "1",
      },
      () => {
        expect(getServerWebhookUrl()).toBe("https://hooks.example.com");
        expect(isMetricsPublic()).toBe(true);
      },
    );
  });
});
