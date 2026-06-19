export type UploadStatus =
  | "waiting"
  | "uploading"
  | "processing"
  | "complete"
  | "failed";

export type CreatorType = "user" | "group";
export type AssetType = "Image" | "Audio";

/** User-editable settings persisted in browser localStorage only. */
export interface UploadConfig {
  apiKey: string;
  creatorId: string;
  creatorType: CreatorType;
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
