import type { UploadPolicyConfig } from "@/lib/types";

export const DEFAULT_NAMING_PATTERN = "^[A-Za-z][A-Za-z0-9_]*$";

export const DEFAULT_UPLOAD_POLICY: UploadPolicyConfig = {
  enabled: false,
  blockOnViolation: true,
  namingPattern: DEFAULT_NAMING_PATTERN,
  maxNameLength: 50,
  warnDuplicateNames: true,
  imageMaxWidth: null,
  imageMaxHeight: null,
  imageMinWidth: null,
  imageMinHeight: null,
};

export const DEFAULT_WEBHOOK_CONFIG = {
  enabled: false,
  url: "",
  secret: "",
  notifyOnBatchComplete: true,
  useSlackFormat: true,
} as const;
