import { createHmac } from "node:crypto";
import { getServerWebhookUrl } from "@/lib/server/config";

export interface BatchWebhookPayload {
  event: "batch.complete";
  actor?: string;
  completedAt: string;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    retried: number;
  };
  assets: Array<{
    name: string;
    assetId?: string;
    type: string;
    status: "complete" | "failed";
    error?: string;
  }>;
}

export interface WebhookDeliveryOptions {
  url: string;
  secret?: string;
  useSlackFormat?: boolean;
}

export async function deliverWebhook(
  payload: BatchWebhookPayload,
  options: WebhookDeliveryOptions,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const url = options.url.trim();
  if (!url) {
    return { ok: false, status: 0, error: "Webhook URL is empty." };
  }

  const body = options.useSlackFormat
    ? JSON.stringify(formatSlackPayload(payload))
    : JSON.stringify(payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Studio-Vault-Webhook/1.0",
  };

  if (options.secret?.trim()) {
    const signature = createHmac("sha256", options.secret.trim())
      .update(body)
      .digest("hex");
    headers["X-Studio-Vault-Signature"] = `sha256=${signature}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `Webhook returned HTTP ${response.status}`,
      };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook delivery failed.";
    return { ok: false, status: 0, error: message };
  }
}

export function resolveWebhookUrl(clientUrl?: string): string {
  const trimmed = clientUrl?.trim();
  if (trimmed) {
    return trimmed;
  }
  return getServerWebhookUrl() ?? "";
}

function formatSlackPayload(payload: BatchWebhookPayload) {
  const assetLines = payload.assets
    .filter((asset) => asset.status === "complete" && asset.assetId)
    .slice(0, 20)
    .map((asset) => `• *${asset.name}* (\`${asset.type}\`) → \`${asset.assetId}\``)
    .join("\n");

  const failedLines = payload.assets
    .filter((asset) => asset.status === "failed")
    .slice(0, 5)
    .map((asset) => `• ${asset.name}: ${asset.error ?? "failed"}`)
    .join("\n");

  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: "Studio Vault — batch complete" },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Succeeded*\n${payload.summary.succeeded}` },
        { type: "mrkdwn", text: `*Failed*\n${payload.summary.failed}` },
        { type: "mrkdwn", text: `*Total*\n${payload.summary.total}` },
        { type: "mrkdwn", text: `*Actor*\n${payload.actor ?? "unknown"}` },
      ],
    },
  ];

  if (assetLines) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Uploaded assets*\n${assetLines}` },
    });
  }

  if (failedLines) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Failures*\n${failedLines}` },
    });
  }

  return {
    text: `Studio Vault batch: ${payload.summary.succeeded} succeeded, ${payload.summary.failed} failed`,
    blocks,
  };
}
