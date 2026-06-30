/** In-process upload metrics for Prometheus scraping (resets on restart). */

const MAX_DURATION_SAMPLES = 512;

interface MetricsState {
  uploadsSucceeded: number;
  uploadsFailed: number;
  uploadsRetried: number;
  rateLimitEvents: number;
  uploadDurationsMs: number[];
  startedAt: number;
}

const state: MetricsState = {
  uploadsSucceeded: 0,
  uploadsFailed: 0,
  uploadsRetried: 0,
  rateLimitEvents: 0,
  uploadDurationsMs: [],
  startedAt: Date.now(),
};

export function recordUploadSuccess(durationMs: number): void {
  state.uploadsSucceeded += 1;
  pushDuration(durationMs);
}

export function recordUploadFailure(durationMs: number, options?: { rateLimited?: boolean }): void {
  state.uploadsFailed += 1;
  if (options?.rateLimited) {
    state.rateLimitEvents += 1;
  }
  pushDuration(durationMs);
}

export function recordUploadRetry(): void {
  state.uploadsRetried += 1;
}

export function isRateLimitError(statusCode: number, message: string): boolean {
  if (statusCode === 429) {
    return true;
  }
  const lower = message.toLowerCase();
  return lower.includes("rate limit") || lower.includes("429");
}

export function getUploadDurationP95Ms(): number {
  if (!state.uploadDurationsMs.length) {
    return 0;
  }
  const sorted = [...state.uploadDurationsMs].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

export function getMetricsSnapshot() {
  return {
    uploadsSucceeded: state.uploadsSucceeded,
    uploadsFailed: state.uploadsFailed,
    uploadsRetried: state.uploadsRetried,
    rateLimitEvents: state.rateLimitEvents,
    uploadDurationP95Ms: getUploadDurationP95Ms(),
    uploadDurationSamples: state.uploadDurationsMs.length,
    uptimeSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
  };
}

export function formatPrometheusMetrics(): string {
  const snap = getMetricsSnapshot();
  const lines = [
    "# HELP studio_vault_uploads_succeeded_total Successful Open Cloud uploads.",
    "# TYPE studio_vault_uploads_succeeded_total counter",
    `studio_vault_uploads_succeeded_total ${snap.uploadsSucceeded}`,
    "# HELP studio_vault_uploads_failed_total Failed Open Cloud uploads.",
    "# TYPE studio_vault_uploads_failed_total counter",
    `studio_vault_uploads_failed_total ${snap.uploadsFailed}`,
    "# HELP studio_vault_uploads_retried_total Client-reported upload retries.",
    "# TYPE studio_vault_uploads_retried_total counter",
    `studio_vault_uploads_retried_total ${snap.uploadsRetried}`,
    "# HELP studio_vault_rate_limit_events_total Roblox rate-limit responses.",
    "# TYPE studio_vault_rate_limit_events_total counter",
    `studio_vault_rate_limit_events_total ${snap.rateLimitEvents}`,
    "# HELP studio_vault_upload_duration_p95_ms Rolling p95 upload duration.",
    "# TYPE studio_vault_upload_duration_p95_ms gauge",
    `studio_vault_upload_duration_p95_ms ${snap.uploadDurationP95Ms}`,
    "# HELP studio_vault_uptime_seconds Process uptime.",
    "# TYPE studio_vault_uptime_seconds gauge",
    `studio_vault_uptime_seconds ${snap.uptimeSeconds}`,
  ];
  return `${lines.join("\n")}\n`;
}

function pushDuration(durationMs: number): void {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return;
  }
  state.uploadDurationsMs.push(durationMs);
  if (state.uploadDurationsMs.length > MAX_DURATION_SAMPLES) {
    state.uploadDurationsMs.shift();
  }
}

/** Test helper — not for production use. */
export function resetMetricsForTests(): void {
  state.uploadsSucceeded = 0;
  state.uploadsFailed = 0;
  state.uploadsRetried = 0;
  state.rateLimitEvents = 0;
  state.uploadDurationsMs = [];
  state.startedAt = Date.now();
}
