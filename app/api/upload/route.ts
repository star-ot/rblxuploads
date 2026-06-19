import { createRobloxAsset, RobloxUploadError } from "@/lib/roblox/client";
import { formatRobloxAssetName } from "@/lib/name-formatter";
import { getAssetType } from "@/lib/file-parser";
import type { CreatorType, UploadApiResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Local upload proxy — the only server route that talks to the outside world.
 *
 * Security model:
 * - API keys come from the browser per request (stored in localStorage client-side).
 * - No .env fallback, no server-side credential storage, no logging of secrets.
 * - Roblox Open Cloud is the sole external network call from this app.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();

    const fileCandidate = formData.get("file");
    const creatorId = `${formData.get("creatorId") ?? ""}`.trim();
    const creatorType = `${formData.get("creatorType") ?? "user"}` as CreatorType;
    const apiKey = `${formData.get("apiKey") ?? ""}`.trim();
    const displayNameRaw = `${formData.get("displayName") ?? ""}`.trim();

    if (!(fileCandidate instanceof File)) {
      return json(
        { ok: false, error: "No upload file was provided." },
        { status: 400 },
      );
    }

    const assetType = getAssetType(fileCandidate);
    if (!assetType) {
      return json(
        {
          ok: false,
          error:
            "Unsupported file type. Use PNG, JPG, JPEG, WEBP, MP3, OGG, WAV, or FLAC.",
        },
        { status: 400 },
      );
    }

    if (!creatorId || !/^\d+$/.test(creatorId)) {
      return json(
        { ok: false, error: "Creator ID must be a numeric Roblox ID." },
        { status: 400 },
      );
    }

    if (creatorType !== "user" && creatorType !== "group") {
      return json(
        { ok: false, error: "Creator type must be either user or group." },
        { status: 400 },
      );
    }

    if (!apiKey) {
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

    return json(response, { status: 200 });
  } catch (error) {
    if (error instanceof RobloxUploadError) {
      return json(
        {
          ok: false,
          error: error.message,
        },
        { status: error.statusCode },
      );
    }

    if (error instanceof Error) {
      return json({ ok: false, error: error.message }, { status: 500 });
    }

    return json(
      { ok: false, error: "Unexpected upload error occurred." },
      { status: 500 },
    );
  }
}

function json(payload: UploadApiResponse, init?: ResponseInit): Response {
  return Response.json(payload, init);
}
