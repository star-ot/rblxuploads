import { getMetricsSnapshot, formatPrometheusMetrics } from "@/lib/server/metrics";
import { isMetricsPublic } from "@/lib/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const accept = request.headers.get("accept") ?? "";
  const wantsJson =
    accept.includes("application/json") ||
    new URL(request.url).searchParams.get("format") === "json";

  if (!isMetricsPublic() && process.env.NODE_ENV === "production") {
    const token = process.env.RBLXUPLOADS_METRICS_TOKEN?.trim();
    const auth = request.headers.get("authorization");
    if (!token || auth !== `Bearer ${token}`) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  if (wantsJson) {
    return Response.json({ ok: true, metrics: getMetricsSnapshot() });
  }

  return new Response(formatPrometheusMetrics(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
