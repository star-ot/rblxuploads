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

/** User-editable settings persisted in browser localStorage only. */
export interface UploadConfig {
  profiles: CredentialProfile[];
  activeProfileId: string | null;
  concurrency: number;
  maxRetries: number;
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
}

export interface LocalAssetExportPayload {
  schemaVersion: 1 | 2;
  exportedAt: string;
  folders: string[];
  assets: LocalAssetRecord[];
}
