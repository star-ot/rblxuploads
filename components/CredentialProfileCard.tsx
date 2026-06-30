"use client";

import {
  getProfileDisplayName,
  isProfileReady,
  maskApiKey,
} from "@/lib/config/credentials";
import type { CredentialProfile } from "@/lib/types";
import { IconCheck } from "@/components/ui/Icon";

interface CredentialProfileCardProps {
  profile: CredentialProfile;
  isActive: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function CredentialProfileCard({
  profile,
  isActive,
  onSelect,
  disabled = false,
}: CredentialProfileCardProps) {
  const ready = isProfileReady(profile);

  return (
    <button
      type="button"
      className={[
        "credential-profile-card",
        isActive ? "credential-profile-card-active" : "",
      ].join(" ")}
      onClick={onSelect}
      disabled={disabled}
      aria-current={isActive ? "true" : undefined}
    >
      <div className="credential-profile-card-inner">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="credential-profile-name truncate text-sm">
                {getProfileDisplayName(profile)}
              </p>
              {isActive ? (
                <span className="credential-profile-active-badge">Active</span>
              ) : null}
            </div>
            <p className="credential-profile-meta mt-1 font-mono text-[11px]">
              <span className="credential-profile-type">
                {profile.creatorType === "group" ? "Group" : "User"}
              </span>
              {profile.creatorId.trim()
                ? ` · ${profile.creatorId.trim()}`
                : " · No ID"}
            </p>
          </div>
          {ready ? (
            <span
              className="credential-status credential-status-ready"
              title="Ready to upload"
            >
              <IconCheck size={12} />
            </span>
          ) : (
            <span
              className="credential-status credential-status-incomplete"
              title="Missing API key or creator ID"
            />
          )}
        </div>
        <p className="credential-profile-key mt-2 truncate font-mono text-[10px]">
          {maskApiKey(profile.apiKey)}
        </p>
      </div>
    </button>
  );
}
