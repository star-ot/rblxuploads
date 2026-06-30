import { resolveUploadActor } from "@/lib/server/actor";
import {
  applyCorsHeaders,
  corsPreflightResponse,
  rejectDisallowedOrigin,
} from "@/lib/server/cors";
import { getServerWebhookSecret } from "@/lib/server/config";
import {
  deliverWebhook,
  resolveWebhookUrl,
  type BatchWebhookPayload,
} from "@/lib/server/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request): Promise<Response> {
  const preflight = corsPreflightResponse(request);
  return preflight ?? new Response(null, { status: 204 });
}

export async function POST(request: Request): Promise<Response> {
  const corsReject = rejectDisallowedOrigin(request);
  if (corsReject) {
    return applyCorsHeaders(request, corsReject);
  }

  let body: BatchWebhookPayload & {
    webhookUrl?: string;
    webhookSecret?: string;
    useSlackFormat?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return applyCorsHeaders(
      request,
      Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 }),
    );
  }

  if (body.event !== "batch.complete") {
    return applyCorsHeaders(
      request,
      Response.json({ ok: false, error: "Unsupported event." }, { status: 400 }),
    );
  }

  const url = resolveWebhookUrl(body.webhookUrl);
  if (!url) {
    return applyCorsHeaders(
      request,
      Response.json(
        { ok: false, error: "No webhook URL configured." },
        { status: 400 },
      ),
    );
  }

  const payload: BatchWebhookPayload = {
    event: "batch.complete",
    actor: body.actor ?? resolveUploadActor(request),
    completedAt: body.completedAt ?? new Date().toISOString(),
    summary: body.summary,
    assets: body.assets ?? [],
  };

  const result = await deliverWebhook(payload, {
    url,
    secret: body.webhookSecret?.trim() || getServerWebhookSecret(),
    useSlackFormat: body.useSlackFormat ?? true,
  });

  if (!result.ok) {
    return applyCorsHeaders(
      request,
      Response.json(
        { ok: false, error: result.error ?? "Webhook delivery failed." },
        { status: 502 },
      ),
    );
  }

  return applyCorsHeaders(request, Response.json({ ok: true, status: result.status }));
}
