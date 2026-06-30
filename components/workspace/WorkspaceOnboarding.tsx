"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCheck, IconX } from "@/components/ui/Icon";

const STORAGE_KEY = "studio-vault:onboarding:v1";

interface OnboardingStep {
  id: string;
  label: string;
  done: boolean;
}

interface WorkspaceOnboardingProps {
  hasCredentials: boolean;
  hasUpload: boolean;
  hasLibraryAssets: boolean;
  onGoSettings: () => void;
  onGoUpload: () => void;
  onGoLibrary: () => void;
}

export function WorkspaceOnboarding({
  hasCredentials,
  hasUpload,
  hasLibraryAssets,
  onGoSettings,
  onGoUpload,
  onGoLibrary,
}: WorkspaceOnboardingProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "dismissed");
  }, []);

  const steps: OnboardingStep[] = [
    { id: "credentials", label: "Add Open Cloud credentials", done: hasCredentials },
    { id: "upload", label: "Upload a test file", done: hasUpload },
    { id: "library", label: "Explore your library", done: hasLibraryAssets },
    { id: "backup", label: "Export a library backup", done: false },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount >= 3;

  if (dismissed || allDone) {
    return null;
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setDismissed(true);
  }

  return (
    <section className="panel border-[var(--accent-muted)] bg-[var(--accent-subtle)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label text-[var(--accent-hover)]">Getting started</p>
          <h2 className="font-display text-base font-medium text-[var(--text-primary)]">
            Studio Vault checklist
          </h2>
          <p className="caption mt-1">
            {completedCount}/{steps.length} complete — dismiss anytime.
          </p>
        </div>
        <button type="button" className="btn-ghost text-xs" onClick={dismiss}>
          <IconX size={14} />
          Dismiss
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2.5"
          >
            <span className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              {step.done ? (
                <IconCheck size={14} className="text-[var(--success-text)]" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-[var(--border-strong)]" />
              )}
              {step.label}
            </span>
            {!step.done && step.id === "credentials" ? (
              <button type="button" className="btn-secondary text-xs" onClick={onGoSettings}>
                Open settings
              </button>
            ) : null}
            {!step.done && step.id === "upload" ? (
              <button type="button" className="btn-secondary text-xs" onClick={onGoUpload}>
                Go to upload
              </button>
            ) : null}
            {!step.done && step.id === "library" ? (
              <button type="button" className="btn-secondary text-xs" onClick={onGoLibrary}>
                Open library
              </button>
            ) : null}
            {!step.done && step.id === "backup" ? (
              <button type="button" className="btn-secondary text-xs" onClick={onGoLibrary}>
                Export in library
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-[var(--text-faint)]">
        Self-hosting a team instance? See the{" "}
        <Link href="/teams" className="link-accent">
          Teams page
        </Link>
        .
      </p>
    </section>
  );
}
