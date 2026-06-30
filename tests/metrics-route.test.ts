import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { GET as metricsGet } from "@/app/api/metrics/route";
import { resetMetricsForTests, recordUploadSuccess } from "@/lib/server/metrics";

describe("GET /api/metrics", () => {
  beforeEach(() => {
    resetMetricsForTests();
  });

  afterEach(() => {
    resetMetricsForTests();
    delete process.env.RBLXUPLOADS_METRICS_TOKEN;
    delete process.env.NODE_ENV;
  });

  it("returns prometheus text by default", async () => {
    recordUploadSuccess(250);
    const response = await metricsGet(new Request("http://localhost/api/metrics"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    const body = await response.text();
    expect(body).toContain("studio_vault_uploads_succeeded_total 1");
  });

  it("returns json when requested", async () => {
    const response = await metricsGet(
      new Request("http://localhost/api/metrics?format=json"),
    );
    const body = (await response.json()) as { ok: boolean; metrics: { uploadsSucceeded: number } };
    expect(body.ok).toBe(true);
    expect(body.metrics.uploadsSucceeded).toBeGreaterThanOrEqual(0);
  });
});
