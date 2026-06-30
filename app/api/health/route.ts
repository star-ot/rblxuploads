import packageJson from "@/package.json";
import { getMetricsSnapshot } from "@/lib/server/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json({
    ok: true,
    version: packageJson.version,
    metrics: getMetricsSnapshot(),
  });
}
