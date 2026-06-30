export type UploadStatus =
  | "waiting"
  | "uploading"
  | "processing"
  | "complete"
  | "failed";

export type CreatorType = "user" | "group";
export type AssetType = "Image" | "Audio" | "Model" | "Mesh";

/** One saved Open Cloud credential set (user or group). */
export interface CredentialProfile {
  id: string;
  label: string;
  apiKey: string;
  creatorId: string;
  creatorType: CreatorType;
  createdAt: number;
  updatedAt: number;
}

/** Resolved credentials for a single upload request. */
export interface UploadCredentials {
  apiKey: string;
  creatorId: string;
  creatorType: CreatorType;
}

/** Prior rbxassetid when an asset is replaced with a new upload. */
export interface AssetVersionEntry {
  assetId: string;
  replacedAt: number;
  fileName?: string;
  thumbnailDataUrl?: string;
}

/** Naming, dimensions, and duplicate rules — enforced client-side and in CI. */
export interface UploadPolicyConfig {
  enabled: boolean;
  blockOnViolation: boolean;
  namingPattern: string;
  maxNameLength: number;
  warnDuplicateNames: boolean;
  imageMaxWidth: number | null;
  imageMaxHeight: number | null;
  imageMinWidth: number | null;
  imageMinHeight: number | null;
}

/** Outbound webhook when upload batches finish (proxied via /api/notify). */
export interface WebhookConfig {
  enabled: boolean;
  url: string;
  secret: string;
  notifyOnBatchComplete: boolean;
  useSlackFormat: boolean;
}

/** User-editable settings persisted in browser localStorage only. */
export interface UploadConfig {
  profiles: CredentialProfile[];
  activeProfileId: string | null;
  concurrency: number;
  maxRetries: number;
  policy: UploadPolicyConfig;
  webhook: WebhookConfig;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  fileName: string;
  previewUrl: string;
  assetType: AssetType;
  assetName: string;
  status: UploadStatus;
  progress: number;
  attempt: number;
  assetId?: string;
  error?: string;
  createdAt: number;
  /** When set, a successful upload replaces this library record and archives the prior ID. */
  replaceLibraryAssetId?: string;
  policyWarnings?: string[];
}

export interface UploadResult {
  assetId: string;
  operationId: string;
}

export interface UploadApiResponse {
  ok: boolean;
  assetId?: string;
  operationId?: string;
  error?: string;
}

export interface LocalAssetRecord {
  id: string;
  name: string;
  type: AssetType;
  assetId: string;
  assetUri: string;
  thumbnailDataUrl?: string;
  fileName: string;
  folderPath: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  /** Stable logical ID across rbxassetid replacements. */
  versionChainId: string;
  /** Prior rbxassetids, oldest first. */
  versions: AssetVersionEntry[];
}

export interface LocalAssetExportPayload {
  schemaVersion: 1 | 2 | 3;
  exportedAt: string;
  folders: string[];
  assets: LocalAssetRecord[];
}

/** Minified Git-friendly manifest (schema v3). */
export interface CompactLibraryExport {
  sv: 3;
  at: string;
  f: string[];
  a: CompactAssetRecord[];
}

export interface CompactAssetRecord {
  c: string;
  n: string;
  t: AssetType;
  i: string;
  p?: string;
  fn?: string;
  fp?: string;
  g?: string[];
  v?: Array<{ i: string; at: number; fn?: string; p?: string }>;
}

export type PolicySeverity = "error" | "warning";

export interface PolicyViolation {
  code: string;
  message: string;
  severity: PolicySeverity;
  fileName?: string;
  field?: string;
}
