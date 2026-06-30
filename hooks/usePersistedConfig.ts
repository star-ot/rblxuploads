"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_UPLOAD_CONFIG } from "@/lib/config/constants";
import {
  loadUploadConfigAsync,
  lockUploadConfig,
  saveUploadConfig,
  unlockUploadConfig,
} from "@/lib/config/storage";
import type { UploadConfig } from "@/lib/types";

/**
 * Keeps upload settings in sync with localStorage (metadata) and IndexedDB (encrypted secrets).
 * Runs only in the browser — no server persistence of credentials.
 */
export function usePersistedConfig() {
  const [config, setConfig] = useState<UploadConfig>(DEFAULT_UPLOAD_CONFIG);
  const [hydrated, setHydrated] = useState(false);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [vaultLoading, setVaultLoading] = useState(true);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    void loadUploadConfigAsync().then(({ config: loaded, locked }) => {
      setConfig(loaded);
      setVaultLocked(locked);
      setHydrated(true);
      setVaultLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || vaultLocked) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void saveUploadConfig(config);
    }, 200);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [config, hydrated, vaultLocked]);

  const lockVault = useCallback(() => {
    setConfig((current) => lockUploadConfig(current));
    setVaultLocked(true);
  }, []);

  const unlockVault = useCallback(async (passphrase: string) => {
    const unlocked = await unlockUploadConfig(config, passphrase);
    setConfig(unlocked);
    setVaultLocked(false);
  }, [config]);

  return {
    config,
    setConfig,
    hydrated,
    vaultLocked,
    vaultLoading,
    lockVault,
    unlockVault,
  } as const;
}
