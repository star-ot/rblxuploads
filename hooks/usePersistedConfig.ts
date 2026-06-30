"use client";

import { useEffect, useState } from "react";
import { DEFAULT_UPLOAD_CONFIG } from "@/lib/config/constants";
import { loadUploadConfig, saveUploadConfig } from "@/lib/config/storage";
import type { UploadConfig } from "@/lib/types";

/**
 * Keeps upload settings in sync with localStorage.
 * Runs only in the browser — no server persistence of credentials.
 */
export function usePersistedConfig() {
  const [config, setConfig] = useState<UploadConfig>(DEFAULT_UPLOAD_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfig(loadUploadConfig());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveUploadConfig(config);
  }, [config, hydrated]);

  return [config, setConfig] as const;
}
