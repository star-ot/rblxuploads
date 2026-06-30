import packageJson from "@/package.json";
import {
  getDeployMode,
  isAuditLogEnabled,
  isPublicAuditLogFlag,
  isTrustProxyEnabled,
} from "@/lib/server/config";
import { siteConfig } from "@/lib/seo/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Safe public instance metadata — no secrets. */
export async function GET(): Promise<Response> {
  const auditLogEnabled = isAuditLogEnabled() || isPublicAuditLogFlag();

  return Response.json({
    ok: true,
    version: packageJson.version,
    deployMode: getDeployMode(),
    auditLogEnabled,
    trustProxy: isTrustProxyEnabled(),
    docs: {
      security: `${siteConfig.links.github}/blob/main/docs/SECURITY.md`,
      deployment: `${siteConfig.links.github}/blob/main/docs/DEPLOYMENT.md`,
      teamWorkflows: `${siteConfig.links.github}/blob/main/docs/TEAM-WORKFLOWS.md`,
      auditLogging: `${siteConfig.links.github}/blob/main/docs/AUDIT-LOGGING.md`,
      ci: `${siteConfig.links.github}/blob/main/docs/CI.md`,
    },
  });
}
