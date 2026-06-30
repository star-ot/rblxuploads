"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CredentialSwitcher } from "@/components/CredentialSwitcher";
import type { UploadConfig } from "@/lib/types";
import {
  IconLibrary,
  IconQueue,
  IconSettings,
} from "@/components/ui/Icon";
import { AppFooter } from "./AppFooter";

type WorkspaceView = "upload" | "library" | "settings";

interface WorkspaceShellProps {
  children: ReactNode;
  activeView: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
  statusMessage?: string;
  queueCount?: number;
  config?: UploadConfig;
  onConfigChange?: (next: UploadConfig) => void;
  configSwitcherDisabled?: boolean;
}

const NAV_ITEMS: { id: WorkspaceView; label: string; icon: typeof IconQueue }[] = [
  { id: "upload", label: "Upload", icon: IconQueue },
  { id: "library", label: "Library", icon: IconLibrary },
  { id: "settings", label: "Settings", icon: IconSettings },
];

export function WorkspaceShell({
  children,
  activeView,
  onViewChange,
  statusMessage,
  queueCount = 0,
  config,
  onConfigChange,
  configSwitcherDisabled = false,
}: WorkspaceShellProps) {
  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-6">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 no-underline">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-muted)] text-[var(--accent)]"
                aria-hidden
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.9" />
                  <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" />
                  <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" />
                  <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" />
                </svg>
              </span>
              <span className="hidden font-display text-[15px] font-medium tracking-tight text-[var(--text-primary)] sm:inline">
                Studio Vault
              </span>
            </Link>

            <nav
              className="flex items-center gap-0.5"
              aria-label="Workspace sections"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={[
                      "workspace-tab flex items-center gap-1.5",
                      isActive ? "workspace-tab-active" : "",
                    ].join(" ")}
                    onClick={() => onViewChange(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                  >
                    <item.icon size={14} />
                    <span className="hidden sm:inline">{item.label}</span>
                    {item.id === "upload" && queueCount > 0 ? (
                      <span className="ml-0.5 rounded bg-[var(--accent-muted)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--accent)]">
                        {queueCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {config && onConfigChange ? (
              <CredentialSwitcher
                config={config}
                onChange={onConfigChange}
                onOpenSettings={() => onViewChange("settings")}
                disabled={configSwitcherDisabled}
              />
            ) : null}
            <p className="hidden font-mono text-[11px] text-[var(--text-faint)] lg:block">
              Local workspace
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {statusMessage ? (
          <div className="alert alert-error mb-5" role="alert">
            {statusMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-6">{children}</div>
      </main>

      <AppFooter />
    </div>
  );
}
