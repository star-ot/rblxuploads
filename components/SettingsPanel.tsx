"use client";

import { useState } from "react";
import type { UploadConfig } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { IconExternal } from "@/components/ui/Icon";

const ROBLOX_CREDENTIALS_URL = "https://create.roblox.com/dashboard/credentials";

interface SettingsPanelProps {
  config: UploadConfig;
  onChange: (next: UploadConfig) => void;
  disabled?: boolean;
}

export function SettingsPanel({
  config,
  onChange,
  disabled = false,
}: SettingsPanelProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  function setField<K extends keyof UploadConfig>(key: K, value: UploadConfig[K]) {
    onChange({
      ...config,
      [key]: value,
    });
  }

  return (
    <section className="panel max-w-3xl">
      <SectionHeader
        title="Open Cloud credentials"
        description="Stored in your browser only. Sent to Roblox during uploads — never written to disk or logged."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span className="label">API key</span>
            <a
              href={ROBLOX_CREDENTIALS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cred-link"
            >
              Create on Creator Dashboard
              <IconExternal size={12} />
            </a>
          </div>
          <div className="flex gap-2">
            <input
              type={showApiKey ? "text" : "password"}
              value={config.apiKey}
              onChange={(event) => setField("apiKey", event.target.value)}
              placeholder="Paste your Open Cloud API key"
              className="field-input font-mono text-sm"
              disabled={disabled}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={() => setShowApiKey((current) => !current)}
              disabled={disabled}
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="caption">
            Enable the <strong className="text-[var(--text-secondary)]">asset</strong> permission
            scope when creating the key. Uploads fail without it.
          </p>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label">Creator ID</span>
          <input
            type="text"
            inputMode="numeric"
            value={config.creatorId}
            onChange={(event) => setField("creatorId", event.target.value)}
            placeholder="User or group ID"
            className="field-input font-mono"
            disabled={disabled}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label">Creator type</span>
          <select
            value={config.creatorType}
            onChange={(event) =>
              setField("creatorType", event.target.value as "user" | "group")
            }
            className="field-input"
            disabled={disabled}
          >
            <option value="user">User</option>
            <option value="group">Group</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label">Parallel uploads</span>
          <input
            type="number"
            min={1}
            max={10}
            value={config.concurrency}
            onChange={(event) => {
              const value = Number(event.target.value) || 1;
              setField("concurrency", Math.max(1, Math.min(10, value)));
            }}
            className="field-input font-mono"
            disabled={disabled}
          />
          <p className="caption">1–10 concurrent requests to Open Cloud</p>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label">Retry attempts</span>
          <input
            type="number"
            min={0}
            max={5}
            value={config.maxRetries}
            onChange={(event) => {
              const value = Number(event.target.value) || 0;
              setField("maxRetries", Math.max(0, Math.min(5, value)));
            }}
            className="field-input font-mono"
            disabled={disabled}
          />
          <p className="caption">0–5 retries per failed file</p>
        </label>
      </div>
    </section>
  );
}
