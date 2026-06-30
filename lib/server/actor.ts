import { isTrustProxyEnabled } from "@/lib/server/config";

/** Resolve upload actor from trusted proxy headers when enabled. */
export function resolveUploadActor(request: Request): string | undefined {
  if (!isTrustProxyEnabled()) {
    return undefined;
  }

  const studioActor = request.headers.get("x-studio-vault-actor")?.trim();
  if (studioActor) {
    return truncateActor(studioActor);
  }

  const forwardedEmail = request.headers.get("x-forwarded-email")?.trim();
  if (forwardedEmail) {
    return truncateActor(forwardedEmail);
  }

  return undefined;
}

function truncateActor(value: string): string {
  return value.length > 200 ? `${value.slice(0, 200)}…` : value;
}
