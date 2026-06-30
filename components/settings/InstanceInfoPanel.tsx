"use client";

import { useEffect, useState } from "react";
import { IconExternal } from "@/components/ui/Icon";
import { siteConfig } from "@/lib/seo/site";

interface InstanceInfo {
  version: string;
  deployMode: string;
  auditLogEnabled: boolean;
  trustProxy: boolean;
  docs: {
    security: string;
    deployment: string;
    teamWorkflows: string;
    auditLogging: string;
    ci: string;
  };
}

export function InstanceInfoPanel() {
  const [info, setInfo] = useState<InstanceInfo | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/instance")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: InstanceInfo) => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const publicAuditFlag =
    process.env.NEXT_PUBLIC_RBLXUPLOADS_AUDIT_LOG === "1";

  return (
    <section className="panel w-full min-w-0">
      <div className="mb-4">
        <h2 className="font-display text-base font-medium text-[var(--text-primary)]">
          Instance info
        </h2>
        <p className="caption mt-1">
          Self-host deployment hints. No secrets are exposed here.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-[var(--text-muted)]">
          Could not load instance metadata. Running in local dev mode.
        </p>
      ) : info ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Version" value={`v${info.version}`} />
          <InfoRow label="Deploy mode" value={info.deployMode} />
          <InfoRow
            label="Audit logging"
            value={
              info.auditLogEnabled || publicAuditFlag ? "Enabled" : "Disabled"
            }
          />
          <InfoRow
            label="Trust proxy"
            value={info.trustProxy ? "On" : "Off"}
          />
        </dl>
      ) : (
        <div className="skeleton h-20 rounded-lg" aria-hidden />
      )}

      <div className="settings-actions settings-instance-links mt-5">
        <DocLink href={info?.docs.deployment ?? `${siteConfig.links.github}/blob/main/docs/DEPLOYMENT.md`}>
          Deploy guide
        </DocLink>
        <DocLink href={info?.docs.security ?? `${siteConfig.links.github}/blob/main/docs/SECURITY.md`}>
          Security
        </DocLink>
        <DocLink href={info?.docs.auditLogging ?? `${siteConfig.links.github}/blob/main/docs/AUDIT-LOGGING.md`}>
          Audit logs
        </DocLink>
        <DocLink href="/teams">Teams page</DocLink>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] px-3 py-2.5">
      <dt className="label">{label}</dt>
      <dd className="mt-1 font-mono text-sm text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  if (external) {
    return (
      <a href={href} className="btn-secondary w-full text-xs sm:w-auto" target="_blank" rel="noopener noreferrer">
        {children}
        <IconExternal size={12} />
      </a>
    );
  }
  return (
    <a href={href} className="btn-secondary w-full text-xs sm:w-auto">
      {children}
    </a>
  );
}
