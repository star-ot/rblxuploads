"use client";

import { useEffect, useState } from "react";
import { loadUploadConfig, saveUploadConfig } from "@/lib/config/storage";
import type { UploadConfig } from "@/lib/types";

/**
 * Keeps upload settings in sync with localStorage.
 * Runs only in the browser — no server persistence of credentials.
 */
export function usePersistedConfig() {
  const [config, setConfig] = useState<UploadConfig>(loadUploadConfig);

  useEffect(() => {
    saveUploadConfig(config);
  }, [config]);

  return [config, setConfig] as const;
}
