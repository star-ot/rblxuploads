"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { githubDocsUrl } from "@/lib/seo/site";

interface MetricsSnapshot {
  uploadsSucceeded: number;
  uploadsFailed: number;
  uploadsRetried: number;
  rateLimitEvents: number;
  uploadDurationP95Ms: number;
  uploadDurationSamples: number;
  uptimeSeconds: number;
}

interface HealthResponse {
  ok: boolean;
  version: string;
  metrics?: MetricsSnapshot;
}

export function ObservabilityPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/health")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: HealthResponse) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = health?.metrics;

  return (
    <section className="panel w-full min-w-0">
      <SectionHeader
        title="Observability"
        description="Live counters from this instance. Scrape /api/metrics for Prometheus or probe /api/health for load balancers."
        meta={health ? `v${health.version}` : undefined}
      />

      {error ? (
        <p className="text-sm text-[var(--text-muted)]">
          Metrics unavailable in this environment.
        </p>
      ) : !metrics ? (
        <div className="observability-skeleton grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-20 rounded-lg" aria-hidden />
          ))}
        </div>
      ) : (
        <>
          <div className="observability-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Succeeded" value={metrics.uploadsSucceeded} tone="success" />
            <MetricCard label="Failed" value={metrics.uploadsFailed} tone="danger" />
            <MetricCard label="Retried" value={metrics.uploadsRetried} />
            <MetricCard label="Rate limits" value={metrics.rateLimitEvents} tone="warning" />
            <MetricCard
              label="p95 duration"
              value={`${metrics.uploadDurationP95Ms}ms`}
              hint={`${metrics.uploadDurationSamples} samples`}
            />
            <MetricCard
              label="Uptime"
              value={formatUptime(metrics.uptimeSeconds)}
            />
          </div>

          <div className="settings-actions settings-instance-links mt-5">
            <a href="/api/metrics" className="cred-link" target="_blank" rel="noopener noreferrer">
              Prometheus metrics
            </a>
            <a href="/api/health" className="cred-link" target="_blank" rel="noopener noreferrer">
              Health JSON
            </a>
            <a
              href={githubDocsUrl("DEPLOYMENT.md")}
              className="cred-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Deploy guide
            </a>
          </div>
        </>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "success" | "danger" | "warning";
}) {
  return (
    <div className={`observability-card observability-card-${tone ?? "neutral"}`}>
      <p className="observability-card-label">{label}</p>
      <p className="observability-card-value font-mono">{value}</p>
      {hint ? <p className="observability-card-hint">{hint}</p> : null}
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}
