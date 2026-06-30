"use client";

import { useState } from "react";
import { DEFAULT_WEBHOOK_CONFIG } from "@/lib/policy/defaults";
import type { UploadConfig, WebhookConfig } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface WebhookSettingsPanelProps {
  config: UploadConfig;
  onChange: (next: UploadConfig) => void;
  disabled?: boolean;
}

export function WebhookSettingsPanel({
  config,
  onChange,
  disabled = false,
}: WebhookSettingsPanelProps) {
  const webhook = { ...DEFAULT_WEBHOOK_CONFIG, ...config.webhook };
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  function updateWebhook(patch: Partial<WebhookConfig>) {
    onChange({
      ...config,
      webhook: { ...webhook, ...patch },
    });
  }

  async function sendTestWebhook() {
    if (!webhook.url.trim()) {
      setTestStatus("Enter a webhook URL first.");
      return;
    }

    setTesting(true);
    setTestStatus(null);

    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "batch.complete",
          webhookUrl: webhook.url.trim(),
          webhookSecret: webhook.secret.trim() || undefined,
          useSlackFormat: webhook.useSlackFormat,
          summary: { total: 2, succeeded: 2, failed: 0, retried: 0 },
          assets: [
            {
              name: "UI_Icon_Test",
              assetId: "18472930102",
              type: "Image",
              status: "complete",
            },
            {
              name: "SFX_Placeholder",
              assetId: "18472930103",
              type: "Audio",
              status: "complete",
            },
          ],
        }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      setTestStatus(
        response.ok && body.ok
          ? "Test webhook delivered."
          : (body.error ?? "Test webhook failed."),
      );
    } catch {
      setTestStatus("Test webhook failed — check URL and network.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="panel w-full min-w-0">
      <SectionHeader
        title="Webhooks"
        description="POST batch summaries to Slack, Discord, or any HTTPS endpoint when uploads finish. Proxied through your instance — keys never leave the browser."
      />

      <label className="settings-toggle-row mb-5 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="settings-toggle mt-0.5"
          checked={webhook.enabled}
          disabled={disabled}
          onChange={(event) => updateWebhook({ enabled: event.target.checked })}
        />
        <span className="min-w-0">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Notify on batch complete
          </span>
          <span className="caption mt-0.5 block">
            Includes asset IDs, types, and failure reasons.
          </span>
        </span>
      </label>

      <div
        className={[
          "grid gap-5 transition-opacity",
          webhook.enabled ? "" : "pointer-events-none opacity-45",
        ].join(" ")}
      >
        <label className="flex flex-col gap-1.5">
          <span className="label">Webhook URL</span>
          <input
            type="url"
            value={webhook.url}
            onChange={(event) => updateWebhook({ url: event.target.value })}
            placeholder="https://hooks.slack.com/services/…"
            className="field-input font-mono text-sm"
            disabled={disabled || !webhook.enabled}
            spellCheck={false}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label">Signing secret (optional)</span>
          <input
            type="password"
            value={webhook.secret}
            onChange={(event) => updateWebhook({ secret: event.target.value })}
            placeholder="HMAC-SHA256 secret for X-Studio-Vault-Signature"
            className="field-input font-mono text-sm"
            disabled={disabled || !webhook.enabled}
            autoComplete="new-password"
          />
        </label>

        <label className="settings-toggle-row flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="settings-toggle"
            checked={webhook.useSlackFormat}
            disabled={disabled || !webhook.enabled}
            onChange={(event) =>
              updateWebhook({ useSlackFormat: event.target.checked })
            }
          />
          <span className="text-sm text-[var(--text-secondary)]">
            Slack-compatible block layout (works with Discord webhooks)
          </span>
        </label>

        <div className="settings-actions">
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto"
            disabled={disabled || !webhook.enabled || testing}
            onClick={() => void sendTestWebhook()}
          >
            {testing ? "Sending…" : "Send test"}
          </button>
          {testStatus ? (
            <p
              className={[
                "text-sm",
                testStatus.includes("delivered")
                  ? "text-[var(--success-text)]"
                  : "text-[var(--text-muted)]",
              ].join(" ")}
            >
              {testStatus}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
