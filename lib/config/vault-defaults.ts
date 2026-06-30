import type { CredentialVaultSettings } from "@/lib/types";

export const DEFAULT_VAULT_SETTINGS: CredentialVaultSettings = {
  mode: "device",
  autoLockMinutes: 0,
  lockOnTabBlur: false,
  rememberOnDevice: false,
};

export const VAULT_AUTO_LOCK_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "60 minutes" },
] as const;
