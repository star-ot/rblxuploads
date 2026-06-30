"use client";

import { useState } from "react";
import { IconLock } from "@/components/ui/Icon";

interface VaultUnlockModalProps {
  open: boolean;
  onUnlock: (passphrase: string) => Promise<void>;
}

export function VaultUnlockModal({ open, onUnlock }: VaultUnlockModalProps) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await onUnlock(passphrase);
      setPassphrase("");
    } catch (unlockError) {
      setError(
        unlockError instanceof Error
          ? unlockError.message
          : "Could not unlock credential vault.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-panel max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-unlock-title"
      >
        <div className="mb-4 flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
            aria-hidden
          >
            <IconLock size={18} />
          </span>
          <div>
            <h2 id="vault-unlock-title" className="text-base font-medium text-[var(--text-primary)]">
              Unlock credential vault
            </h2>
            <p className="caption mt-1">
              Profile labels and creator IDs are visible. Enter your vault passphrase to use API keys.
            </p>
          </div>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="label">Vault passphrase</span>
            <input
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              className="field-input font-mono"
              autoComplete="current-password"
              autoFocus
              disabled={busy}
            />
          </label>

          {error ? (
            <p className="text-sm text-[var(--danger-text)]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy || !passphrase.trim()}
          >
            {busy ? "Unlocking…" : "Unlock vault"}
          </button>
        </form>
      </div>
    </div>
  );
}
