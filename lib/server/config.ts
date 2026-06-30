/** Server-side configuration — never import from client components. */

export function isAuditLogEnabled(): boolean {
  return process.env.RBLXUPLOADS_AUDIT_LOG === "1";
}

export function getAuditLogPath(): string | undefined {
  const path = process.env.RBLXUPLOADS_AUDIT_LOG_PATH?.trim();
  return path || undefined;
}

export function isTrustProxyEnabled(): boolean {
  return process.env.RBLXUPLOADS_TRUST_PROXY === "1";
}

export function getAllowedOrigins(): string[] | null {
  const raw = process.env.RBLXUPLOADS_ALLOWED_ORIGINS?.trim();
  if (!raw) {
    return null;
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isPublicAuditLogFlag(): boolean {
  return process.env.NEXT_PUBLIC_RBLXUPLOADS_AUDIT_LOG === "1";
}

export function getDeployMode(): "self-hosted" | "local-dev" {
  if (process.env.NODE_ENV === "development") {
    return "local-dev";
  }
  return "self-hosted";
}

export function getServerWebhookUrl(): string | undefined {
  const url = process.env.RBLXUPLOADS_WEBHOOK_URL?.trim();
  return url || undefined;
}

export function getServerWebhookSecret(): string | undefined {
  const secret = process.env.RBLXUPLOADS_WEBHOOK_SECRET?.trim();
  return secret || undefined;
}

export function isMetricsPublic(): boolean {
  return process.env.RBLXUPLOADS_METRICS_PUBLIC === "1";
}
