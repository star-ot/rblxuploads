"use client";

import { useState } from "react";
import type { UploadConfig } from "@/lib/types";

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
  const [expanded, setExpanded] = useState(true);

  function setField<K extends keyof UploadConfig>(key: K, value: UploadConfig[K]) {
    onChange({
      ...config,
      [key]: value,
    });
  }

  return (
    <section className="panel">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-[var(--text-primary)]">Credentials</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Saved in your browser only. Never written to disk or sent anywhere except
            Roblox during uploads.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary shrink-0"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Open Cloud API key
            </span>
            <div className="flex gap-2">
              <input
                type={showApiKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(event) => setField("apiKey", event.target.value)}
                placeholder="Paste key from create.roblox.com/dashboard/credentials"
                className="field-input"
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
                {showApiKey ? "Hide" : "Reveal"}
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Creator ID
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={config.creatorId}
              onChange={(event) => setField("creatorId", event.target.value)}
              placeholder="Your user or group ID"
              className="field-input font-mono"
              disabled={disabled}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Creator type
            </span>
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
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Parallel uploads
            </span>
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
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Retry attempts
            </span>
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
          </label>
        </div>
      ) : null}
    </section>
  );
}
