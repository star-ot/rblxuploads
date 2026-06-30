"use client";

import { useEffect, useRef, useState } from "react";
import {
  getActiveProfile,
  getProfileDisplayName,
  isProfileReady,
  setActiveProfileId,
} from "@/lib/config/credentials";
import type { UploadConfig } from "@/lib/types";
import { IconChevronDown, IconCheck, IconSettings } from "@/components/ui/Icon";

interface CredentialSwitcherProps {
  config: UploadConfig;
  onChange: (next: UploadConfig) => void;
  onOpenSettings?: () => void;
  disabled?: boolean;
}

export function CredentialSwitcher({
  config,
  onChange,
  onOpenSettings,
  disabled = false,
}: CredentialSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeProfile = getActiveProfile(config);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (config.profiles.length === 0) {
    return (
      <button
        type="button"
        className="credential-switcher credential-switcher-empty"
        onClick={onOpenSettings}
        disabled={disabled}
      >
        <IconSettings size={14} />
        <span className="hidden sm:inline">Add credentials</span>
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="credential-switcher"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="credential-switcher-badge">
          {activeProfile?.creatorType === "group" ? "GRP" : "USR"}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">
          {activeProfile
            ? getProfileDisplayName(activeProfile)
            : "Select profile"}
        </span>
        <IconChevronDown
          size={14}
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        />
      </button>

      {open ? (
        <div className="credential-switcher-menu" role="listbox">
          {config.profiles.map((profile) => {
            const isActive = activeProfile?.id === profile.id;
            const ready = isProfileReady(profile);

            return (
              <button
                key={profile.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={[
                  "credential-switcher-option",
                  isActive ? "credential-switcher-option-active" : "",
                ].join(" ")}
                onClick={() => {
                  onChange(setActiveProfileId(config, profile.id));
                  setOpen(false);
                }}
              >
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm text-[var(--text-primary)]">
                    {getProfileDisplayName(profile)}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] text-[var(--text-muted)]">
                    {profile.creatorType === "group" ? "Group" : "User"}
                    {profile.creatorId.trim()
                      ? ` ${profile.creatorId.trim()}`
                      : ""}
                    {!ready ? " · incomplete" : ""}
                  </span>
                </span>
                {isActive ? (
                  <IconCheck size={14} className="shrink-0 text-[var(--accent)]" />
                ) : null}
              </button>
            );
          })}

          {onOpenSettings ? (
            <button
              type="button"
              className="credential-switcher-footer"
              onClick={() => {
                setOpen(false);
                onOpenSettings();
              }}
            >
              <IconSettings size={13} />
              Manage profiles
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
