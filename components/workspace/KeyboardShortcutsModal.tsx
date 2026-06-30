"use client";

import { useEffect } from "react";
import { IconX } from "@/components/ui/Icon";

const SHORTCUTS = [
  { keys: "/", description: "Focus library search (when on Library)" },
  { keys: "?", description: "Open this shortcuts panel" },
  { keys: "U", description: "Switch to Upload view" },
  { keys: "L", description: "Switch to Library view" },
  { keys: "S", description: "Switch to Settings view" },
  { keys: "Esc", description: "Close modals" },
] as const;

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel max-w-md"
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="shortcuts-title" className="font-display text-base font-medium text-[var(--text-primary)]">
            Keyboard shortcuts
          </h2>
          <button type="button" className="btn-ghost p-1.5" onClick={onClose} aria-label="Close">
            <IconX size={16} />
          </button>
        </div>

        <ul className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.keys}
              className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] px-3 py-2"
            >
              <span className="text-sm text-[var(--text-muted)]">{shortcut.description}</span>
              <kbd className="kbd">{shortcut.keys}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function useWorkspaceShortcuts(options: {
  onUpload: () => void;
  onLibrary: () => void;
  onSettings: () => void;
  onHelp: () => void;
  enabled?: boolean;
}) {
  const { onUpload, onLibrary, onSettings, onHelp, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        onHelp();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "u") {
        event.preventDefault();
        onUpload();
      } else if (key === "l") {
        event.preventDefault();
        onLibrary();
      } else if (key === "s") {
        event.preventDefault();
        onSettings();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onHelp, onLibrary, onSettings, onUpload]);
}
