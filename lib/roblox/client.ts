/**
 * Server-side Roblox Open Cloud client.
 *
 * This module is imported only from API routes — never from client components.
 * The browser cannot call Roblox directly (CORS), so uploads are proxied through
 * the local Next.js server at POST /api/upload.
 */

const ROBLOX_ASSETS_BASE_URL = `https://apis.roblox.com/assets/v1`;
const CREATE_ASSET_URL = `${ROBLOX_ASSETS_BASE_URL}/assets`;

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 20;

export interface RobloxUploadInput {
  apiKey: string;
  creatorId: string;
  creatorType: "user" | "group";
  assetType: "Image" | "Audio" | "Model" | "Mesh";
  displayName: string;
  file: File;
}

export interface RobloxUploadResult {
  operationId: string;
  assetId: string;
}

export interface RobloxModelUpdateInput {
  apiKey: string;
  creatorId: string;
  creatorType: "user" | "group";
  assetId: string;
  displayName: string;
  file: File;
}

interface RobloxOperationResponse {
  path?: string;
  done?: boolean;
  response?: {
    assetId?: string;
  };
  error?: {
    code?: number;
    message?: string;
    details?: unknown;
  };
  message?: string;
  errors?: Array<{
    message?: string;
    code?: number | string;
  }>;
}

export class RobloxUploadError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "RobloxUploadError";
    this.statusCode = statusCode;
  }
}

export async function createRobloxAsset(
  input: RobloxUploadInput,
): Promise<RobloxUploadResult> {
  const formData = new FormData();
  const normalizedFile = await normalizeFileForRobloxUpload(input.file);

  formData.append(
    "request",
    JSON.stringify({
      assetType: input.assetType,
      displayName: input.displayName,
      description: `Uploaded via Studio Vault: ${input.displayName}`,
      creationContext: {
        creator:
          input.creatorType === "group"
            ? { groupId: input.creatorId }
            : { userId: input.creatorId },
      },
    }),
  );
  formData.append("fileContent", normalizedFile, normalizedFile.name);

  const createResponse = await fetch(CREATE_ASSET_URL, {
    method: "POST",
    headers: {
      "x-api-key": input.apiKey,
    },
    body: formData,
  });

  const createPayload = (await readJsonSafe(createResponse)) as
    | RobloxOperationResponse
    | undefined;

  if (!createResponse.ok) {
    throw createRobloxError(
      createResponse.status,
      "Roblox asset creation failed.",
      createPayload,
    );
  }

  const operationPath = createPayload?.path;
  const operationId =
    operationPath?.split("/").filter(Boolean).at(-1) ??
    createPayload?.response?.assetId;

  if (!operationId) {
    throw new RobloxUploadError(
      "Roblox did not return an operation ID for this upload.",
      502,
    );
  }

  const operation = await pollOperation({
    apiKey: input.apiKey,
    operationId,
  });

  const assetId = operation.response?.assetId;

  if (!assetId) {
    throw new RobloxUploadError(
      operation.error?.message ??
        "Roblox operation completed without an asset ID.",
      502,
    );
  }

  return {
    operationId,
    assetId,
  };
}

export async function updateRobloxModelPackage(
  input: RobloxModelUpdateInput,
): Promise<RobloxUploadResult> {
  const formData = new FormData();
  const normalizedFile = await normalizeFileForRobloxUpload(input.file);

  formData.append(
    "request",
    JSON.stringify({
      assetType: "Model",
      assetId: Number(input.assetId),
      displayName: input.displayName,
      creationContext: {
        creator:
          input.creatorType === "group"
            ? { groupId: input.creatorId }
            : { userId: input.creatorId },
      },
    }),
  );
  formData.append("fileContent", normalizedFile, normalizedFile.name);

  const updateResponse = await fetch(
    `${CREATE_ASSET_URL}/${encodeURIComponent(input.assetId)}`,
    {
      method: "PATCH",
      headers: {
        "x-api-key": input.apiKey,
      },
      body: formData,
    },
  );

  const updatePayload = (await readJsonSafe(updateResponse)) as
    | RobloxOperationResponse
    | undefined;

  if (!updateResponse.ok) {
    throw createRobloxError(
      updateResponse.status,
      "Roblox model update failed.",
      updatePayload,
    );
  }

  const operationPath = updatePayload?.path;
  const operationId =
    operationPath?.split("/").filter(Boolean).at(-1) ??
    updatePayload?.response?.assetId;

  if (!operationId) {
    throw new RobloxUploadError(
      "Roblox did not return an operation ID for this model update.",
      502,
    );
  }

  const operation = await pollOperation({
    apiKey: input.apiKey,
    operationId,
  });

  const assetId = operation.response?.assetId ?? input.assetId;

  return {
    operationId,
    assetId,
  };
}

async function pollOperation({
  apiKey,
  operationId,
}: {
  apiKey: string;
  operationId: string;
}): Promise<RobloxOperationResponse> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const operationUrl = `${ROBLOX_ASSETS_BASE_URL}/operations/${operationId}`;

    const operationResponse = await fetch(operationUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    const operationPayload = (await readJsonSafe(operationResponse)) as
      | RobloxOperationResponse
      | undefined;

    if (!operationResponse.ok) {
      throw createRobloxError(
        operationResponse.status,
        "Failed to read Roblox upload operation status.",
        operationPayload,
      );
    }

    if (operationPayload?.done) {
      return operationPayload;
    }

    await wait(POLL_INTERVAL_MS);
  }

  throw new RobloxUploadError(
    "Timed out while waiting for Roblox to finish processing this asset.",
    504,
  );
}

function createRobloxError(
  statusCode: number,
  fallbackMessage: string,
  payload?: RobloxOperationResponse,
): RobloxUploadError {
  if (statusCode === 401 || statusCode === 403) {
    return new RobloxUploadError(
      "Invalid or unauthorized Roblox Open Cloud API key.",
      statusCode,
    );
  }

  if (statusCode === 429) {
    return new RobloxUploadError(
      "Roblox rate limit reached. Slow down and retry.",
      statusCode,
    );
  }

  const payloadMessage = extractRobloxErrorMessage(payload);
  const message = payloadMessage ?? fallbackMessage;
  return new RobloxUploadError(message, statusCode);
}

async function readJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function normalizeFileForRobloxUpload(file: File): Promise<File> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const expectedType = getRobloxContentTypeFromExtension(extension);

  if (!expectedType || file.type === expectedType) {
    return file;
  }

  const buffer = await file.arrayBuffer();
  return new File([buffer], file.name, {
    type: expectedType,
    lastModified: Date.now(),
  });
}

function getRobloxContentTypeFromExtension(extension: string): string | null {
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "bmp":
      return "image/bmp";
    case "tga":
      return "image/tga";
    case "mp3":
      return "audio/mpeg";
    case "ogg":
      return "audio/ogg";
    case "wav":
      return "audio/wav";
    case "flac":
      return "audio/flac";
    case "fbx":
      return "model/fbx";
    case "gltf":
      return "model/gltf+json";
    case "glb":
      return "model/gltf-binary";
    case "rbxm":
    case "rbxmx":
      return "model/x-rbxm";
    case "mesh":
      return "model/x-file-mesh-data";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/mov";
    default:
      return null;
  }
}

function extractRobloxErrorMessage(payload?: RobloxOperationResponse): string | null {
  if (!payload) {
    return null;
  }

  const detailText = safeJsonStringify(
    payload.error?.details ?? payload.errors,
  );

  if (payload.error?.message) {
    return detailText
      ? `${payload.error.message} (details: ${detailText})`
      : payload.error.message;
  }

  if (payload.message) {
    return payload.message;
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    if (first?.message) {
      return first.code
        ? `${first.message} (code: ${String(first.code)})`
        : first.message;
    }
  }

  return null;
}

function safeJsonStringify(value: unknown): string {
  try {
    const serialized = JSON.stringify(value);
    return serialized.length > 300 ? `${serialized.slice(0, 300)}…` : serialized;
  } catch {
    return "[unserializable details]";
  }
}
