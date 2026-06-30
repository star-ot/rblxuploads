import { randomUUID } from "node:crypto";
import {
  createRobloxAsset,
  RobloxUploadError,
  updateRobloxModelPackage,
} from "@/lib/roblox/client";
import { translateUploadError } from "@/lib/roblox/error-messages";
import { formatRobloxAssetName } from "@/lib/name-formatter";
import { canUpdateModelPackage, getAssetType } from "@/lib/file-parser";
import { resolveUploadActor } from "@/lib/server/actor";
import {
  sanitizeAuditError,
  writeAuditLog,
  type AuditEventType,
} from "@/lib/server/audit-log";
import {
  applyCorsHeaders,
  corsPreflightResponse,
  rejectDisallowedOrigin,
} from "@/lib/server/cors";
import {
  isRateLimitError,
  recordUploadFailure,
  recordUploadRetry,
  recordUploadSuccess,
} from "@/lib/server/metrics";
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
export async function OPTIONS(request: Request): Promise<Response> {
  const preflight = corsPreflightResponse(request);
  return preflight ?? new Response(null, { status: 204 });
}

export async function POST(request: Request): Promise<Response> {
  return handleUpload(request, "asset.create", handleCreateRequest);
}

export async function PATCH(request: Request): Promise<Response> {
  return handleUpload(request, "asset.patch", handlePatchRequest);
}

type UploadHandler = (
  request: Request,
  context: UploadContext,
) => Promise<Response>;

interface UploadContext {
  requestId: string;
  actor?: string;
  startedAt: number;
  attempt: number;
}

async function handleUpload(
  request: Request,
  event: AuditEventType,
  handler: UploadHandler,
): Promise<Response> {
  const corsReject = rejectDisallowedOrigin(request);
  if (corsReject) {
    return applyCorsHeaders(request, corsReject);
  }

  const context: UploadContext = {
    requestId: randomUUID(),
    actor: resolveUploadActor(request),
    startedAt: Date.now(),
    attempt: parseUploadAttempt(request),
  };

  if (context.attempt > 1) {
    recordUploadRetry();
  }

  const response = await handler(request, context);
  return applyCorsHeaders(request, response);
}

async function handlePatchRequest(
  request: Request,
  context: UploadContext,
): Promise<Response> {
  let creatorId = "";
  let creatorType: CreatorType = "user";
  let displayName = "";
  let fileName = "";
  const assetType = "Model";

  try {
    const formData = await request.formData();

    const fileCandidate = formData.get("file");
    creatorId = `${formData.get("creatorId") ?? ""}`.trim();
    creatorType = `${formData.get("creatorType") ?? "user"}` as CreatorType;
    const apiKey = `${formData.get("apiKey") ?? ""}`.trim();
    const assetId = `${formData.get("assetId") ?? ""}`.trim();
    const displayNameRaw = `${formData.get("displayName") ?? ""}`.trim();

    if (!(fileCandidate instanceof File)) {
      return await finishFailure({
        event: "asset.patch",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw,
        fileName: "",
        assetType,
        status: 400,
        error: "No model file was provided for update.",
      });
    }

    fileName = fileCandidate.name;

    if (!canUpdateModelPackage(fileCandidate)) {
      return await finishFailure({
        event: "asset.patch",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw || fileName,
        fileName,
        assetType,
        status: 400,
        error:
          "Model package updates currently support FBX files only in Roblox Open Cloud.",
      });
    }

    if (!creatorId || !/^\d+$/.test(creatorId)) {
      return await finishFailure({
        event: "asset.patch",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw || fileName,
        fileName,
        assetType,
        status: 400,
        error: "Creator ID must be a numeric Roblox ID.",
      });
    }

    if (creatorType !== "user" && creatorType !== "group") {
      return await finishFailure({
        event: "asset.patch",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw || fileName,
        fileName,
        assetType,
        status: 400,
        error: "Creator type must be either user or group.",
      });
    }

    if (!assetId || !/^\d+$/.test(assetId)) {
      return await finishFailure({
        event: "asset.patch",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw || fileName,
        fileName,
        assetType,
        status: 400,
        error: "Target model asset ID must be numeric.",
      });
    }

    if (!apiKey) {
      return await finishFailure({
        event: "asset.patch",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw || fileName,
        fileName,
        assetType,
        status: 400,
        error: "Missing API key. Enter your Roblox Open Cloud key in Settings.",
      });
    }

    displayName = formatRobloxAssetName(displayNameRaw || fileCandidate.name);

    const result = await updateRobloxModelPackage({
      apiKey,
      creatorId,
      creatorType,
      assetId,
      displayName,
      file: fileCandidate,
    });

    await writeAuditLog({
      ts: new Date().toISOString(),
      event: "asset.patch",
      actor: context.actor,
      creatorId,
      creatorType,
      assetId: result.assetId,
      displayName,
      fileName,
      assetType,
      status: "success",
      durationMs: Date.now() - context.startedAt,
      requestId: context.requestId,
    });

    recordUploadSuccess(Date.now() - context.startedAt);

    logUploadDebug("PATCH", "Model update success", {
      fileName,
      creatorType,
      creatorId,
      targetAssetId: assetId,
      resultingAssetId: result.assetId,
      operationId: result.operationId,
      requestId: context.requestId,
    });

    return json(
      {
        ok: true,
        assetId: result.assetId,
        operationId: result.operationId,
      },
      { status: 200 },
    );
  } catch (error) {
    return await handleUploadError(error, {
      event: "asset.patch",
      context,
      creatorId,
      creatorType,
      displayName,
      fileName,
      assetType,
      method: "PATCH",
    });
  }
}

async function handleCreateRequest(
  request: Request,
  context: UploadContext,
): Promise<Response> {
  let creatorId = "";
  let creatorType: CreatorType = "user";
  let displayName = "";
  let fileName = "";
  let assetType = "Image";

  try {
    const formData = await request.formData();

    const fileCandidate = formData.get("file");
    creatorId = `${formData.get("creatorId") ?? ""}`.trim();
    creatorType = `${formData.get("creatorType") ?? "user"}` as CreatorType;
    const apiKey = `${formData.get("apiKey") ?? ""}`.trim();
    const displayNameRaw = `${formData.get("displayName") ?? ""}`.trim();

    if (!(fileCandidate instanceof File)) {
      return await finishFailure({
        event: "asset.create",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw,
        fileName: "",
        assetType,
        status: 400,
        error: "No upload file was provided.",
      });
    }

    fileName = fileCandidate.name;
    const resolvedType = getAssetType(fileCandidate);
    if (!resolvedType) {
      return await finishFailure({
        event: "asset.create",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw || fileName,
        fileName,
        assetType: "Unknown",
        status: 400,
        error:
          "Unsupported file type. Use PNG, JPG, JPEG, WEBP, MP3, OGG, WAV, FLAC, FBX, GLTF, GLB, RBXM, RBXMX, or MESH.",
      });
    }

    assetType = resolvedType;

    if (!creatorId || !/^\d+$/.test(creatorId)) {
      return await finishFailure({
        event: "asset.create",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw || fileName,
        fileName,
        assetType,
        status: 400,
        error: "Creator ID must be a numeric Roblox ID.",
      });
    }

    if (creatorType !== "user" && creatorType !== "group") {
      return await finishFailure({
        event: "asset.create",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw || fileName,
        fileName,
        assetType,
        status: 400,
        error: "Creator type must be either user or group.",
      });
    }

    if (!apiKey) {
      return await finishFailure({
        event: "asset.create",
        context,
        creatorId,
        creatorType,
        displayName: displayNameRaw || fileName,
        fileName,
        assetType,
        status: 400,
        error: "Missing API key. Enter your Roblox Open Cloud key in Settings.",
      });
    }

    displayName = formatRobloxAssetName(displayNameRaw || fileCandidate.name);

    const result = await createRobloxAsset({
      apiKey,
      creatorId,
      creatorType,
      assetType: resolvedType,
      displayName,
      file: fileCandidate,
    });

    await writeAuditLog({
      ts: new Date().toISOString(),
      event: "asset.create",
      actor: context.actor,
      creatorId,
      creatorType,
      assetId: result.assetId,
      displayName,
      fileName,
      assetType,
      status: "success",
      durationMs: Date.now() - context.startedAt,
      requestId: context.requestId,
    });

    recordUploadSuccess(Date.now() - context.startedAt);

    logUploadDebug("POST", "Upload success", {
      fileName,
      assetType,
      creatorType,
      creatorId,
      resultingAssetId: result.assetId,
      operationId: result.operationId,
      requestId: context.requestId,
    });

    return json(
      {
        ok: true,
        assetId: result.assetId,
        operationId: result.operationId,
      },
      { status: 200 },
    );
  } catch (error) {
    return await handleUploadError(error, {
      event: "asset.create",
      context,
      creatorId,
      creatorType,
      displayName,
      fileName,
      assetType,
      method: "POST",
    });
  }
}

async function finishFailure(options: {
  event: AuditEventType;
  context: UploadContext;
  creatorId: string;
  creatorType: CreatorType;
  displayName: string;
  fileName: string;
  assetType: string;
  status: number;
  error: string;
}): Promise<Response> {
  const friendlyError = translateUploadError(options.error);
  const durationMs = Date.now() - options.context.startedAt;

  recordUploadFailure(durationMs, {
    rateLimited: isRateLimitError(options.status, friendlyError),
  });

  await writeAuditLog({
    ts: new Date().toISOString(),
    event: options.event,
    actor: options.context.actor,
    creatorId: options.creatorId || "unknown",
    creatorType: options.creatorType,
    displayName: options.displayName || options.fileName || "unknown",
    fileName: options.fileName || "unknown",
    assetType: options.assetType,
    status: "failure",
    error: sanitizeAuditError(friendlyError),
    durationMs: Date.now() - options.context.startedAt,
    requestId: options.context.requestId,
  });

  return json({ ok: false, error: friendlyError }, { status: options.status });
}

async function handleUploadError(
  error: unknown,
  options: {
    event: AuditEventType;
    context: UploadContext;
    creatorId: string;
    creatorType: CreatorType;
    displayName: string;
    fileName: string;
    assetType: string;
    method: "POST" | "PATCH";
  },
): Promise<Response> {
  if (error instanceof RobloxUploadError) {
    const friendlyError = translateUploadError(error.message);
    const durationMs = Date.now() - options.context.startedAt;
    logUploadDebug(options.method, "Roblox upload error", {
      errorMessage: friendlyError,
      statusCode: error.statusCode,
      requestId: options.context.requestId,
    });

    recordUploadFailure(durationMs, {
      rateLimited: isRateLimitError(error.statusCode, friendlyError),
    });

    await writeAuditLog({
      ts: new Date().toISOString(),
      event: options.event,
      actor: options.context.actor,
      creatorId: options.creatorId || "unknown",
      creatorType: options.creatorType,
      displayName: options.displayName || options.fileName || "unknown",
      fileName: options.fileName || "unknown",
      assetType: options.assetType,
      status: "failure",
      error: sanitizeAuditError(friendlyError),
      durationMs: Date.now() - options.context.startedAt,
      requestId: options.context.requestId,
    });

    return json({ ok: false, error: friendlyError }, { status: error.statusCode });
  }

  if (error instanceof Error) {
    const friendlyError = translateUploadError(error.message);
    const durationMs = Date.now() - options.context.startedAt;
    logUploadDebug(options.method, "Unexpected server error", {
      errorMessage: friendlyError,
      requestId: options.context.requestId,
    });

    recordUploadFailure(durationMs);

    await writeAuditLog({
      ts: new Date().toISOString(),
      event: options.event,
      actor: options.context.actor,
      creatorId: options.creatorId || "unknown",
      creatorType: options.creatorType,
      displayName: options.displayName || options.fileName || "unknown",
      fileName: options.fileName || "unknown",
      assetType: options.assetType,
      status: "failure",
      error: sanitizeAuditError(friendlyError),
      durationMs: Date.now() - options.context.startedAt,
      requestId: options.context.requestId,
    });

    return json({ ok: false, error: friendlyError }, { status: 500 });
  }

  logUploadDebug(options.method, "Unknown non-error throw", {
    requestId: options.context.requestId,
  });
  return json(
    { ok: false, error: "Unexpected upload error occurred." },
    { status: 500 },
  );
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

  const safeDetails = { ...details };
  delete safeDetails.apiKey;

  console.error("[upload-debug]", {
    method,
    message,
    ...safeDetails,
    at: new Date().toISOString(),
  });
}

function parseUploadAttempt(request: Request): number {
  const raw =
    request.headers.get("x-upload-attempt") ??
    request.headers.get("X-Upload-Attempt");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}
