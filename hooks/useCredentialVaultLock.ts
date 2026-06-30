"use client";

import { useEffect, useRef } from "react";
import type { UploadConfig } from "@/lib/types";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

interface UseCredentialVaultLockOptions {
  config: UploadConfig;
  vaultLocked: boolean;
  lockVault: () => void;
}

/**
 * Auto-lock passphrase vaults after idle time or when the tab loses focus.
 */
export function useCredentialVaultLock({
  config,
  vaultLocked,
  lockVault,
}: UseCredentialVaultLockOptions) {
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (vaultLocked || config.vault.mode !== "passphrase") {
      return;
    }

    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }

    const interval = window.setInterval(() => {
      const minutes = config.vault.autoLockMinutes;
      if (minutes <= 0) {
        return;
      }

      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= minutes * 60_000) {
        lockVault();
      }
    }, 15_000);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && config.vault.lockOnTabBlur) {
        lockVault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActivity);
      }
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [
    config.vault.autoLockMinutes,
    config.vault.lockOnTabBlur,
    config.vault.mode,
    lockVault,
    vaultLocked,
  ]);
}
