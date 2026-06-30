import type { UploadConfig, UploadQueueItem } from "@/lib/types";

export interface BatchNotifyPayload {
  total: number;
  succeeded: number;
  failed: number;
  retried: number;
  items: UploadQueueItem[];
}

export async function notifyBatchComplete(
  config: UploadConfig,
  payload: BatchNotifyPayload,
): Promise<{ ok: boolean; error?: string }> {
  if (!config.webhook.enabled || !config.webhook.notifyOnBatchComplete) {
    return { ok: true };
  }

  const url = config.webhook.url.trim();
  if (!url) {
    return { ok: false, error: "Webhook URL is empty." };
  }

  const finished = payload.items.filter(
    (item) => item.status === "complete" || item.status === "failed",
  );

  try {
    const response = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "batch.complete",
        completedAt: new Date().toISOString(),
        webhookUrl: url,
        webhookSecret: config.webhook.secret.trim() || undefined,
        useSlackFormat: config.webhook.useSlackFormat,
        summary: {
          total: payload.total,
          succeeded: payload.succeeded,
          failed: payload.failed,
          retried: payload.retried,
        },
        assets: finished.map((item) => ({
          name: item.assetName,
          assetId: item.assetId,
          type: item.assetType,
          status: item.status === "complete" ? "complete" : "failed",
          error: item.error,
        })),
      }),
    });

    const body = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !body.ok) {
      return { ok: false, error: body.error ?? "Webhook notification failed." };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook notification failed.";
    return { ok: false, error: message };
  }
}
