import {
  createRobloxAsset,
  RobloxUploadError,
  updateRobloxModelPackage,
} from "@/lib/roblox/client";
import { formatRobloxAssetName } from "@/lib/name-formatter";
import { canUpdateModelPackage, getAssetType } from "@/lib/file-parser";
import type { CreatorType, UploadApiResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const DEBUG_UPLOAD_LOGS =
  process.env.NODE_ENV !== "production" || process.env.RBLXUPLOADS_DEBUG === "1";

/**
 * Local upload proxy — the only server route that talks to the outside world.
 *
 * Security model:
 * - API keys come from the browser per request (stored in localStorage client-side).
 * - No .env fallback, no server-side credential storage, no logging of secrets.
 * - Roblox Open Cloud is the sole external network call from this app.
 */
export async function POST(request: Request): Promise<Response> {
  return handleCreateRequest(request);
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();

    const fileCandidate = formData.get("file");
    const creatorId = `${formData.get("creatorId") ?? ""}`.trim();
    const creatorType = `${formData.get("creatorType") ?? "user"}` as CreatorType;
    const apiKey = `${formData.get("apiKey") ?? ""}`.trim();
    const assetId = `${formData.get("assetId") ?? ""}`.trim();
    const displayNameRaw = `${formData.get("displayName") ?? ""}`.trim();

    if (!(fileCandidate instanceof File)) {
      logUploadDebug("PATCH", "Validation failed", {
        reason: "No file provided",
      });
      return json(
        { ok: false, error: "No model file was provided for update." },
        { status: 400 },
      );
    }

    if (!canUpdateModelPackage(fileCandidate)) {
      logUploadDebug("PATCH", "Validation failed", {
        reason: "Model update with unsupported extension",
        fileName: fileCandidate.name,
        fileType: fileCandidate.type,
        fileSize: fileCandidate.size,
      });
      return json(
        {
          ok: false,
          error:
            "Model package updates currently support FBX files only in Roblox Open Cloud.",
        },
        { status: 400 },
      );
    }

    if (!creatorId || !/^\d+$/.test(creatorId)) {
      logUploadDebug("PATCH", "Validation failed", {
        reason: "Invalid creatorId",
        creatorId,
      });
      return json(
        { ok: false, error: "Creator ID must be a numeric Roblox ID." },
        { status: 400 },
      );
    }

    if (creatorType !== "user" && creatorType !== "group") {
      logUploadDebug("PATCH", "Validation failed", {
        reason: "Invalid creatorType",
        creatorType,
      });
      return json(
        { ok: false, error: "Creator type must be either user or group." },
        { status: 400 },
      );
    }

    if (!assetId || !/^\d+$/.test(assetId)) {
      logUploadDebug("PATCH", "Validation failed", {
        reason: "Invalid target assetId",
        assetId,
      });
      return json(
        { ok: false, error: "Target model asset ID must be numeric." },
        { status: 400 },
      );
    }

    if (!apiKey) {
      logUploadDebug("PATCH", "Validation failed", {
        reason: "Missing apiKey",
      });
      return json(
        {
          ok: false,
          error: "Missing API key. Enter your Roblox Open Cloud key in Settings.",
        },
        { status: 400 },
      );
    }

    const displayName = formatRobloxAssetName(
      displayNameRaw || fileCandidate.name,
    );

    const result = await updateRobloxModelPackage({
      apiKey,
      creatorId,
      creatorType,
      assetId,
      displayName,
      file: fileCandidate,
    });

    const response: UploadApiResponse = {
      ok: true,
      assetId: result.assetId,
      operationId: result.operationId,
    };

    logUploadDebug("PATCH", "Model update success", {
      fileName: fileCandidate.name,
      fileType: fileCandidate.type,
      fileSize: fileCandidate.size,
      creatorType,
      creatorId,
      targetAssetId: assetId,
      resultingAssetId: result.assetId,
      operationId: result.operationId,
    });

    return json(response, { status: 200 });
  } catch (error) {
    if (error instanceof RobloxUploadError) {
      logUploadDebug("PATCH", "Roblox upload error", {
        errorMessage: error.message,
        statusCode: error.statusCode,
      });
      return json(
        {
          ok: false,
          error: error.message,
        },
        { status: error.statusCode },
      );
    }

    if (error instanceof Error) {
      logUploadDebug("PATCH", "Unexpected server error", {
        errorMessage: error.message,
      });
      return json({ ok: false, error: error.message }, { status: 500 });
    }

    logUploadDebug("PATCH", "Unknown non-error throw", {});
    return json(
      { ok: false, error: "Unexpected model update error occurred." },
      { status: 500 },
    );
  }
}

async function handleCreateRequest(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();

    const fileCandidate = formData.get("file");
    const creatorId = `${formData.get("creatorId") ?? ""}`.trim();
    const creatorType = `${formData.get("creatorType") ?? "user"}` as CreatorType;
    const apiKey = `${formData.get("apiKey") ?? ""}`.trim();
    const displayNameRaw = `${formData.get("displayName") ?? ""}`.trim();

    if (!(fileCandidate instanceof File)) {
      logUploadDebug("POST", "Validation failed", {
        reason: "No file provided",
      });
      return json(
        { ok: false, error: "No upload file was provided." },
        { status: 400 },
      );
    }

    const assetType = getAssetType(fileCandidate);
    if (!assetType) {
      logUploadDebug("POST", "Validation failed", {
        reason: "Unsupported file type",
        fileName: fileCandidate.name,
        fileType: fileCandidate.type,
        fileSize: fileCandidate.size,
      });
      return json(
        {
          ok: false,
          error:
            "Unsupported file type. Use PNG, JPG, JPEG, WEBP, MP3, OGG, WAV, FLAC, FBX, GLTF, GLB, RBXM, RBXMX, or MESH.",
        },
        { status: 400 },
      );
    }

    if (!creatorId || !/^\d+$/.test(creatorId)) {
      logUploadDebug("POST", "Validation failed", {
        reason: "Invalid creatorId",
        creatorId,
      });
      return json(
        { ok: false, error: "Creator ID must be a numeric Roblox ID." },
        { status: 400 },
      );
    }

    if (creatorType !== "user" && creatorType !== "group") {
      logUploadDebug("POST", "Validation failed", {
        reason: "Invalid creatorType",
        creatorType,
      });
      return json(
        { ok: false, error: "Creator type must be either user or group." },
        { status: 400 },
      );
    }

    if (!apiKey) {
      logUploadDebug("POST", "Validation failed", {
        reason: "Missing apiKey",
      });
      return json(
        {
          ok: false,
          error: "Missing API key. Enter your Roblox Open Cloud key in Settings.",
        },
        { status: 400 },
      );
    }

    const displayName = formatRobloxAssetName(
      displayNameRaw || fileCandidate.name,
    );

    const result = await createRobloxAsset({
      apiKey,
      creatorId,
      creatorType,
      assetType,
      displayName,
      file: fileCandidate,
    });

    const response: UploadApiResponse = {
      ok: true,
      assetId: result.assetId,
      operationId: result.operationId,
    };

    logUploadDebug("POST", "Upload success", {
      fileName: fileCandidate.name,
      fileType: fileCandidate.type,
      fileSize: fileCandidate.size,
      assetType,
      creatorType,
      creatorId,
      resultingAssetId: result.assetId,
      operationId: result.operationId,
    });

    return json(response, { status: 200 });
  } catch (error) {
    if (error instanceof RobloxUploadError) {
      logUploadDebug("POST", "Roblox upload error", {
        errorMessage: error.message,
        statusCode: error.statusCode,
      });
      return json(
        {
          ok: false,
          error: error.message,
        },
        { status: error.statusCode },
      );
    }

    if (error instanceof Error) {
      logUploadDebug("POST", "Unexpected server error", {
        errorMessage: error.message,
      });
      return json({ ok: false, error: error.message }, { status: 500 });
    }

    logUploadDebug("POST", "Unknown non-error throw", {});
    return json(
      { ok: false, error: "Unexpected upload error occurred." },
      { status: 500 },
    );
  }
}

function json(payload: UploadApiResponse, init?: ResponseInit): Response {
  return Response.json(payload, init);
}

function logUploadDebug(
  method: "POST" | "PATCH",
  message: string,
  details: Record<string, unknown>,
): void {
  if (!DEBUG_UPLOAD_LOGS) {
    return;
  }

  console.error("[upload-debug]", {
    method,
    message,
    ...details,
    at: new Date().toISOString(),
  });
}
