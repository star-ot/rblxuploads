import packageJson from "@/package.json";
import {
  getDeployMode,
  isAuditLogEnabled,
  isPublicAuditLogFlag,
  isTrustProxyEnabled,
} from "@/lib/server/config";
import { githubDocsUrl } from "@/lib/seo/site";

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
      security: githubDocsUrl("SECURITY.md"),
      deployment: githubDocsUrl("DEPLOYMENT.md"),
      teamWorkflows: githubDocsUrl("TEAM-WORKFLOWS.md"),
      auditLogging: githubDocsUrl("AUDIT-LOGGING.md"),
      ci: githubDocsUrl("CI.md"),
    },
  });
}
