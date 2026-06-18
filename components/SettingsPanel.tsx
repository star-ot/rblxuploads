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

  function setField<K extends keyof UploadConfig>(key: K, value: UploadConfig[K]) {
    onChange({
      ...config,
      [key]: value,
    });
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/20">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-100">Configuration</h2>
        <p className="text-sm text-zinc-400">
          Values are saved locally in your browser. Uploads are proxied through
          server routes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-300">Roblox Open Cloud API Key</span>
          <div className="flex gap-2">
            <input
              type={showApiKey ? "text" : "password"}
              value={config.apiKey}
              onChange={(event) => setField("apiKey", event.target.value)}
              placeholder="rbx-open-cloud-key..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
              disabled={disabled}
            />
            <button
              type="button"
              className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => setShowApiKey((current) => !current)}
              disabled={disabled}
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-300">Creator ID</span>
          <input
            type="text"
            value={config.creatorId}
            onChange={(event) => setField("creatorId", event.target.value)}
            placeholder="12345678"
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            disabled={disabled}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-300">Creator Type</span>
          <select
            value={config.creatorType}
            onChange={(event) => setField("creatorType", event.target.value as "user" | "group")}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            disabled={disabled}
          >
            <option value="user">User</option>
            <option value="group">Group</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-300">PUBLIC_BLOB_READ_WRITE_TOKEN</span>
          <input
            type="text"
            value={config.publicBlobReadWriteToken}
            onChange={(event) =>
              setField("publicBlobReadWriteToken", event.target.value)
            }
            placeholder="vercel_blob_rw_..."
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            disabled={disabled}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-300">Concurrency</span>
          <input
            type="number"
            min={1}
            max={10}
            value={config.concurrency}
            onChange={(event) => {
              const value = Number(event.target.value) || 1;
              setField("concurrency", Math.max(1, Math.min(10, value)));
            }}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            disabled={disabled}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-300">Max Retries</span>
          <input
            type="number"
            min={0}
            max={5}
            value={config.maxRetries}
            onChange={(event) => {
              const value = Number(event.target.value) || 0;
              setField("maxRetries", Math.max(0, Math.min(5, value)));
            }}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            disabled={disabled}
          />
        </label>
      </div>
    </section>
  );
}
