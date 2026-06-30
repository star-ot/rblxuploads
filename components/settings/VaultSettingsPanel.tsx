"use client";

import { useState } from "react";
import {
  changeVaultPassphrase,
  enableDeviceVault,
  enablePassphraseVault,
  extractSecrets,
} from "@/lib/config/credential-vault";
import { saveUploadConfig } from "@/lib/config/storage";
import { VAULT_AUTO_LOCK_OPTIONS } from "@/lib/config/vault-defaults";
import type { UploadConfig } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface VaultSettingsPanelProps {
  config: UploadConfig;
  onChange: (next: UploadConfig) => void;
  vaultLocked: boolean;
  onLockVault: () => void;
  disabled?: boolean;
}

export function VaultSettingsPanel({
  config,
  onChange,
  vaultLocked,
  onLockVault,
  disabled = false,
}: VaultSettingsPanelProps) {
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [nextPassphrase, setNextPassphrase] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassphraseSetup, setShowPassphraseSetup] = useState(false);

  const isPassphraseMode = config.vault.mode === "passphrase";

  function updateVaultField<K extends keyof UploadConfig["vault"]>(
    key: K,
    value: UploadConfig["vault"][K],
  ) {
    onChange({
      ...config,
      vault: {
        ...config.vault,
        [key]: value,
      },
    });
    setStatus(null);
    setError(null);
  }

  async function enablePassphraseMode() {
    if (!newPassphrase.trim()) {
      setError("Set a vault passphrase before enabling passphrase mode.");
      return;
    }
    if (newPassphrase !== confirmPassphrase) {
      setError("Passphrase confirmation does not match.");
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      const secrets = extractSecrets(config);
      const next = {
        ...config,
        vault: { ...config.vault, mode: "passphrase" as const },
      };
      await enablePassphraseVault(next, secrets, newPassphrase);
      onChange(next);
      await saveUploadConfig(next);
      setNewPassphrase("");
      setConfirmPassphrase("");
      setShowPassphraseSetup(false);
      setStatus("Passphrase vault enabled. Use Lock vault when you leave a shared machine.");
    } catch (enableError) {
      setError(
        enableError instanceof Error
          ? enableError.message
          : "Could not enable passphrase vault.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function switchToDeviceMode() {
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      const secrets = extractSecrets(config);
      await enableDeviceVault(config, secrets);
      const next = {
        ...config,
        vault: {
          ...config.vault,
          mode: "device" as const,
          rememberOnDevice: false,
        },
      };
      onChange(next);
      await saveUploadConfig(next);
      setShowPassphraseSetup(false);
      setStatus("Switched to device-bound encryption. Keys unlock automatically on this browser.");
    } catch (switchError) {
      setError(
        switchError instanceof Error
          ? switchError.message
          : "Could not switch to device-bound encryption.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleChangePassphrase(event: React.FormEvent) {
    event.preventDefault();
    if (vaultLocked) {
      setError("Unlock the vault before changing the passphrase.");
      return;
    }
    if (!nextPassphrase.trim()) {
      setError("Enter a new passphrase.");
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      await changeVaultPassphrase(
        config,
        extractSecrets(config),
        currentPassphrase,
        nextPassphrase,
      );
      await saveUploadConfig(config);
      setCurrentPassphrase("");
      setNextPassphrase("");
      setStatus("Vault passphrase updated.");
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Could not change vault passphrase.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel w-full min-w-0">
      <SectionHeader
        title="Credential vault"
        description="API keys and webhook secrets are encrypted in IndexedDB. Profile metadata stays readable in localStorage. Device mode is automatic; passphrase mode is optional for shared machines."
      />

      <div className="mt-5 grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] p-4">
            <input
              type="radio"
              name="vault-mode"
              checked={!isPassphraseMode}
              onChange={() => {
                if (isPassphraseMode) {
                  void switchToDeviceMode();
                }
              }}
              disabled={disabled || busy || vaultLocked}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-[var(--text-primary)]">
                Device-bound (default)
              </span>
              <span className="caption mt-1 block">
                Auto-encrypt on this browser with no unlock step. Protects against casual
                storage inspection and copying localStorage to another PC.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] p-4">
            <input
              type="radio"
              name="vault-mode"
              checked={isPassphraseMode || showPassphraseSetup}
              onChange={() => setShowPassphraseSetup(true)}
              disabled={disabled || busy}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-[var(--text-primary)]">
                Passphrase vault
              </span>
              <span className="caption mt-1 block">
                Opt-in for studios and shared VMs. Keys decrypt only after unlock and live in
                memory until auto-lock.
              </span>
            </span>
          </label>
        </div>

        {!isPassphraseMode && showPassphraseSetup ? (
          <div className="grid gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="label">New vault passphrase</span>
              <input
                type="password"
                value={newPassphrase}
                onChange={(event) => setNewPassphrase(event.target.value)}
                className="field-input"
                autoComplete="new-password"
                disabled={disabled || busy || vaultLocked}
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="label">Confirm passphrase</span>
              <input
                type="password"
                value={confirmPassphrase}
                onChange={(event) => setConfirmPassphrase(event.target.value)}
                className="field-input"
                autoComplete="new-password"
                disabled={disabled || busy || vaultLocked}
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="button"
                className="btn-primary"
                disabled={disabled || busy || vaultLocked || !newPassphrase.trim()}
                onClick={() => void enablePassphraseMode()}
              >
                Enable passphrase vault
              </button>
              <button
                type="button"
                className="btn-ghost"
                disabled={disabled || busy}
                onClick={() => setShowPassphraseSetup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {isPassphraseMode ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="label">Auto-lock after inactivity</span>
              <select
                value={config.vault.autoLockMinutes}
                onChange={(event) =>
                  updateVaultField("autoLockMinutes", Number(event.target.value))
                }
                className="field-input"
                disabled={disabled || vaultLocked}
              >
                {VAULT_AUTO_LOCK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 self-end pb-2">
              <input
                type="checkbox"
                checked={config.vault.lockOnTabBlur}
                onChange={(event) =>
                  updateVaultField("lockOnTabBlur", event.target.checked)
                }
                disabled={disabled || vaultLocked}
              />
              <span className="text-sm text-[var(--text-secondary)]">
                Lock when tab loses focus
              </span>
            </label>

            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={config.vault.rememberOnDevice}
                onChange={(event) =>
                  updateVaultField("rememberOnDevice", event.target.checked)
                }
                disabled={disabled || vaultLocked}
              />
              <span className="text-sm text-[var(--text-secondary)]">
                Remember on this device — faster daily unlock on trusted machines
              </span>
            </label>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={onLockVault}
                disabled={disabled || vaultLocked}
              >
                Lock vault now
              </button>
            </div>

            <form
              onSubmit={(event) => void handleChangePassphrase(event)}
              className="grid gap-4 rounded-xl border border-[var(--border-subtle)] p-4 sm:col-span-2 sm:grid-cols-2"
            >
              <p className="label sm:col-span-2">Change passphrase</p>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="label">Current passphrase</span>
                <input
                  type="password"
                  value={currentPassphrase}
                  onChange={(event) => setCurrentPassphrase(event.target.value)}
                  className="field-input"
                  autoComplete="current-password"
                  disabled={disabled || busy || vaultLocked}
                />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="label">New passphrase</span>
                <input
                  type="password"
                  value={nextPassphrase}
                  onChange={(event) => setNextPassphrase(event.target.value)}
                  className="field-input"
                  autoComplete="new-password"
                  disabled={disabled || busy || vaultLocked}
                />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="btn-secondary"
                  disabled={disabled || busy || vaultLocked || !currentPassphrase.trim()}
                >
                  Update passphrase
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {status ? (
          <p className="text-sm text-[var(--accent)]" role="status">
            {status}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-[var(--danger-text)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
