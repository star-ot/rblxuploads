import { describe, expect, it, beforeEach } from "vitest";
import {
  formatPrometheusMetrics,
  getMetricsSnapshot,
  getUploadDurationP95Ms,
  isRateLimitError,
  recordUploadFailure,
  recordUploadSuccess,
  resetMetricsForTests,
} from "@/lib/server/metrics";

describe("server metrics", () => {
  beforeEach(() => {
    resetMetricsForTests();
  });

  it("tracks successes and rolling p95 duration", () => {
    recordUploadSuccess(100);
    recordUploadSuccess(300);
    recordUploadSuccess(200);

    const snap = getMetricsSnapshot();
    expect(snap.uploadsSucceeded).toBe(3);
    expect(getUploadDurationP95Ms()).toBeGreaterThanOrEqual(200);
  });

  it("detects rate-limit failures", () => {
    recordUploadFailure(500, { rateLimited: true });
    const snap = getMetricsSnapshot();
    expect(snap.uploadsFailed).toBe(1);
    expect(snap.rateLimitEvents).toBe(1);
  });

  it("exports prometheus text format", () => {
    recordUploadSuccess(120);
    const body = formatPrometheusMetrics();
    expect(body).toContain("studio_vault_uploads_succeeded_total 1");
    expect(body).toContain("studio_vault_upload_duration_p95_ms");
  });

  it("classifies rate limit status codes", () => {
    expect(isRateLimitError(429, "too many requests")).toBe(true);
    expect(isRateLimitError(500, "internal error")).toBe(false);
  });
});
