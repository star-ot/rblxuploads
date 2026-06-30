"use client";

import Link from "next/link";
import { useState } from "react";
import { CredentialProfileCard } from "@/components/CredentialProfileCard";
import { CredentialSwitcher } from "@/components/CredentialSwitcher";
import {
  getActiveProfile,
  getProfileDisplayName,
  setActiveProfileId,
} from "@/lib/config/credentials";
import { DEMO_UPLOAD_CONFIG } from "@/lib/demo-credentials";
import type { UploadConfig } from "@/lib/types";
import {
  IconCheck,
  IconLibrary,
  IconQueue,
  IconSettings,
} from "@/components/ui/Icon";

const SECURITY_POINTS = [
  "Profile metadata in localStorage — API keys encrypted in IndexedDB",
  "Device-bound encryption by default; passphrase vault for studios",
  "Keys masked in lists; reveal only when you choose",
  "Up to 25 profiles for users, groups, and environments",
] as const;

export function LandingCredentialsDemo() {
  const [config, setConfig] = useState<UploadConfig>(DEMO_UPLOAD_CONFIG);
  const [showApiKey, setShowApiKey] = useState(false);
  const activeProfile = getActiveProfile(config);

  function selectProfile(profileId: string) {
    setConfig(setActiveProfileId(config, profileId));
    setShowApiKey(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <span className="font-display text-sm font-medium text-[var(--text-primary)]">
              Studio Vault
            </span>
            <nav
              className="hidden items-center gap-0.5 sm:flex"
              aria-label="Demo workspace tabs"
            >
              {[
                { id: "upload", label: "Upload", icon: IconQueue, active: true },
                { id: "library", label: "Library", icon: IconLibrary, active: false },
                { id: "settings", label: "Settings", icon: IconSettings, active: false },
              ].map((tab) => (
                <span
                  key={tab.id}
                  className={[
                    "workspace-tab pointer-events-none flex items-center gap-1.5 text-[12px]",
                    tab.active ? "workspace-tab-active" : "",
                  ].join(" ")}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </span>
              ))}
            </nav>
          </div>

          <CredentialSwitcher config={config} onChange={setConfig} />
        </div>
      </div>

      {activeProfile ? (
        <div className="border-b border-[var(--border-subtle)] bg-[var(--accent-subtle)] px-4 py-3 sm:px-5">
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">Upload target:</span>{" "}
            Assets publish to{" "}
            <span className="font-mono text-[var(--accent)]">
              {activeProfile.creatorType === "group" ? "Group" : "User"}{" "}
              {activeProfile.creatorId}
            </span>{" "}
            using{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {getProfileDisplayName(activeProfile)}
            </span>
          </p>
        </div>
      ) : null}

      <div className="grid gap-0 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <aside className="border-b border-[var(--border-subtle)] p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="label">Profiles</span>
            <span className="font-mono text-[10px] text-[var(--text-faint)]">
              {config.profiles.length} saved
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {config.profiles.map((profile) => (
              <CredentialProfileCard
                key={profile.id}
                profile={profile}
                isActive={activeProfile?.id === profile.id}
                onSelect={() => selectProfile(profile.id)}
              />
            ))}
          </div>

          <p className="caption mt-3">
            Click a profile or use the header switcher — same controls as the workspace.
          </p>
        </aside>

        <div className="p-4 sm:p-5">
          {activeProfile ? (
            <div className="credential-editor credential-editor-active">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-[var(--text-primary)]">
                  {getProfileDisplayName(activeProfile)}
                </h3>
                <p className="caption mt-1">
                  Real settings panel — your keys stay in the browser until upload.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="label">API key</span>
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={activeProfile.apiKey}
                      readOnly
                      className="field-input font-mono text-sm"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="btn-secondary shrink-0"
                      onClick={() => setShowApiKey((current) => !current)}
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="caption">
                    Demo keys only — paste your real Open Cloud key in the workspace.
                  </p>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="label">Creator ID</span>
                  <input
                    type="text"
                    value={activeProfile.creatorId}
                    readOnly
                    className="field-input font-mono"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="label">Creator type</span>
                  <select
                    value={activeProfile.creatorType}
                    disabled
                    className="field-input"
                  >
                    <option value="user">User</option>
                    <option value="group">Group</option>
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {SECURITY_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] px-3 py-2.5 text-[13px] text-[var(--text-muted)]"
              >
                <IconCheck
                  size={14}
                  className="mt-0.5 shrink-0 text-[var(--success-text)]"
                />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/workspace" className="btn-primary">
              Set up your profiles
            </Link>
            <a href="#faq" className="btn-secondary">
              Security FAQ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
