"use client";

import { useRef, useState } from "react";
import {
  addProfile,
  duplicateProfile,
  getActiveProfile,
  MAX_CREDENTIAL_PROFILES,
  removeProfile,
  setActiveProfileId,
  suggestProfileLabel,
  upsertProfile,
} from "@/lib/config/credentials";
import { InstanceInfoPanel } from "@/components/settings/InstanceInfoPanel";
import { ObservabilityPanel } from "@/components/settings/ObservabilityPanel";
import { PolicySettingsPanel } from "@/components/settings/PolicySettingsPanel";
import { WebhookSettingsPanel } from "@/components/settings/WebhookSettingsPanel";
import {
  exportProfileMetadata,
  importProfileMetadata,
  type ProfileMetadataExport,
} from "@/lib/config/profile-export";
import type { CredentialProfile, CreatorType, UploadConfig } from "@/lib/types";
import { CredentialProfileCard } from "@/components/CredentialProfileCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  IconCopy,
  IconExternal,
  IconPlus,
  IconTrash,
} from "@/components/ui/Icon";

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
  const activeProfile = getActiveProfile(config);
  const [showApiKey, setShowApiKey] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingKeyExport, setPendingKeyExport] = useState(false);
  const profileImportRef = useRef<HTMLInputElement>(null);

  function updateProfile(profile: CredentialProfile) {
    onChange(upsertProfile(config, profile));
  }

  function updateProfileField<K extends keyof CredentialProfile>(
    key: K,
    value: CredentialProfile[K],
  ) {
    if (!activeProfile) {
      return;
    }

    const next: CredentialProfile = {
      ...activeProfile,
      [key]: value,
      updatedAt: Date.now(),
    };

    if (
      (key === "creatorId" || key === "creatorType") &&
      (!activeProfile.label.trim() ||
        activeProfile.label ===
          suggestProfileLabel(activeProfile.creatorType, activeProfile.creatorId))
    ) {
      next.label = suggestProfileLabel(
        key === "creatorType" ? (value as CreatorType) : next.creatorType,
        key === "creatorId" ? String(value) : next.creatorId,
      );
    }

    updateProfile(next);
  }

  function setQueueField<K extends "concurrency" | "maxRetries">(
    key: K,
    value: UploadConfig[K],
  ) {
    onChange({
      ...config,
      [key]: value,
    });
  }

  function handleAddProfile() {
    onChange(addProfile(config));
    setShowApiKey(false);
    setPendingDeleteId(null);
  }

  function handleSelectProfile(profileId: string) {
    onChange(setActiveProfileId(config, profileId));
    setShowApiKey(false);
    setPendingDeleteId(null);
  }

  function handleDeleteProfile(profileId: string) {
    if (pendingDeleteId !== profileId) {
      setPendingDeleteId(profileId);
      return;
    }

    onChange(removeProfile(config, profileId));
    setPendingDeleteId(null);
    setShowApiKey(false);
  }

  function handleDuplicateProfile(profileId: string) {
    onChange(duplicateProfile(config, profileId));
    setShowApiKey(false);
    setPendingDeleteId(null);
  }

  function exportProfiles(includeApiKeys: boolean) {
    const payload = exportProfileMetadata(config, { includeApiKeys });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `studio-vault-profiles-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setPendingKeyExport(false);
  }

  async function importProfiles(file: File) {
    const text = await file.text();
    const payload = JSON.parse(text) as ProfileMetadataExport;
    if (!payload.profiles || !Array.isArray(payload.profiles)) {
      return;
    }
    onChange(importProfileMetadata(config, payload, { merge: true }));
  }

  return (
    <div className="settings-panel flex w-full min-w-0 max-w-5xl flex-col gap-4 sm:gap-5">
      <section className="panel w-full min-w-0">
        <SectionHeader
          title="Credential profiles"
          description="Save separate API keys for different users or groups. Everything stays in your browser — never on our servers."
        />

        <div className="mt-5 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start">
          <aside className="w-full min-w-0 lg:w-72 lg:shrink-0">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="label">Profiles</span>
              <span className="font-mono text-[11px] text-[var(--text-faint)]">
                {config.profiles.length}/{MAX_CREDENTIAL_PROFILES}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {config.profiles.length === 0 ? (
                <div className="credential-empty">
                  <p className="text-sm text-[var(--text-secondary)]">
                    No profiles yet. Add one to start uploading.
                  </p>
                </div>
              ) : (
                config.profiles.map((profile) => (
                  <CredentialProfileCard
                    key={profile.id}
                    profile={profile}
                    isActive={activeProfile?.id === profile.id}
                    onSelect={() => handleSelectProfile(profile.id)}
                    disabled={disabled}
                  />
                ))
              )}

              <button
                type="button"
                className="btn-secondary w-full"
                onClick={handleAddProfile}
                disabled={
                  disabled || config.profiles.length >= MAX_CREDENTIAL_PROFILES
                }
              >
                <IconPlus size={14} />
                Add profile
              </button>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {activeProfile ? (
              <div className="credential-editor credential-editor-active min-w-0">
                <div className="settings-profile-toolbar mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">
                      Edit profile
                    </h3>
                    <p className="caption mt-1">
                      Keys are sent to Roblox only when you upload — never logged
                      or stored on disk.
                    </p>
                  </div>
                  <div className="settings-inline-actions flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => handleDuplicateProfile(activeProfile.id)}
                      disabled={
                        disabled ||
                        config.profiles.length >= MAX_CREDENTIAL_PROFILES
                      }
                    >
                      <IconCopy size={13} />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className={[
                        "btn-ghost text-xs",
                        pendingDeleteId === activeProfile.id
                          ? "text-[var(--danger-text)]"
                          : "",
                      ].join(" ")}
                      onClick={() => handleDeleteProfile(activeProfile.id)}
                      disabled={disabled}
                    >
                      <IconTrash size={13} />
                      {pendingDeleteId === activeProfile.id
                        ? "Confirm delete"
                        : "Delete"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="label">Profile name</span>
                    <input
                      type="text"
                      value={activeProfile.label}
                      onChange={(event) =>
                        updateProfileField("label", event.target.value)
                      }
                      placeholder="e.g. Main group, Personal account"
                      className="field-input"
                      disabled={disabled}
                    />
                  </label>

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
                    <div className="settings-api-key-row flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={activeProfile.apiKey}
                        onChange={(event) =>
                          updateProfileField("apiKey", event.target.value)
                        }
                        placeholder="Paste your Open Cloud API key"
                        className="field-input min-w-0 flex-1 font-mono text-sm"
                        disabled={disabled}
                        autoComplete="new-password"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore
                      />
                      <button
                        type="button"
                        className="btn-secondary w-full shrink-0 sm:w-auto"
                        onClick={() => setShowApiKey((current) => !current)}
                        disabled={disabled}
                      >
                        {showApiKey ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="caption flex-1">
                        Enable the{" "}
                        <strong className="text-[var(--text-secondary)]">
                          asset
                        </strong>{" "}
                        permission scope. Uploads fail without it.
                      </p>
                      {activeProfile.apiKey.trim() ? (
                        <button
                          type="button"
                          className="btn-ghost text-xs text-[var(--danger-text)]"
                          onClick={() => updateProfileField("apiKey", "")}
                          disabled={disabled}
                        >
                          Clear key
                        </button>
                      ) : null}
                    </div>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="label">Creator ID</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={activeProfile.creatorId}
                      onChange={(event) =>
                        updateProfileField("creatorId", event.target.value)
                      }
                      placeholder="User or group ID"
                      className="field-input font-mono"
                      disabled={disabled}
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="label">Creator type</span>
                    <select
                      value={activeProfile.creatorType}
                      onChange={(event) =>
                        updateProfileField(
                          "creatorType",
                          event.target.value as CreatorType,
                        )
                      }
                      className="field-input"
                      disabled={disabled}
                    >
                      <option value="user">User</option>
                      <option value="group">Group</option>
                    </select>
                  </label>
                </div>
              </div>
            ) : (
              <div className="credential-empty flex min-h-48 flex-col items-center justify-center text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  Add a profile to configure your Open Cloud credentials.
                </p>
                <button
                  type="button"
                  className="btn-primary mt-4"
                  onClick={handleAddProfile}
                  disabled={disabled}
                >
                  <IconPlus size={14} />
                  Create first profile
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel w-full min-w-0">
        <SectionHeader
          title="Upload queue"
          description="Shared across all credential profiles."
        />

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="label">Parallel uploads</span>
            <input
              type="number"
              min={1}
              max={10}
              value={config.concurrency}
              onChange={(event) => {
                const value = Number(event.target.value) || 1;
                setQueueField(
                  "concurrency",
                  Math.max(1, Math.min(10, value)),
                );
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
                setQueueField("maxRetries", Math.max(0, Math.min(5, value)));
              }}
              className="field-input font-mono"
              disabled={disabled}
            />
            <p className="caption">0–5 retries per failed file</p>
          </label>
        </div>
      </section>

      <section className="panel w-full min-w-0">
        <SectionHeader
          title="Team profile export"
          description="Share profile labels and creator IDs with teammates. API keys are excluded unless you explicitly opt in."
        />
        <div className="settings-actions mt-4">
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto"
            disabled={disabled || config.profiles.length === 0}
            onClick={() => exportProfiles(false)}
          >
            Export metadata (no keys)
          </button>
          {!pendingKeyExport ? (
            <button
              type="button"
              className="btn-ghost w-full text-[var(--danger-text)] sm:w-auto"
              disabled={disabled}
              onClick={() => setPendingKeyExport(true)}
            >
              Export with API keys…
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary w-full bg-[var(--danger-bg)] text-[var(--danger-text)] sm:w-auto"
              disabled={disabled}
              onClick={() => exportProfiles(true)}
            >
              Confirm — keys will be in plaintext JSON
            </button>
          )}
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto"
            disabled={disabled}
            onClick={() => profileImportRef.current?.click()}
          >
            Import profiles
          </button>
        </div>
        <input
          ref={profileImportRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importProfiles(file);
            event.target.value = "";
          }}
        />
      </section>

      <PolicySettingsPanel config={config} onChange={onChange} disabled={disabled} />

      <WebhookSettingsPanel config={config} onChange={onChange} disabled={disabled} />

      <ObservabilityPanel />

      <InstanceInfoPanel />
    </div>
  );
}
