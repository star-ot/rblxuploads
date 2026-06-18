import { createRobloxImageAsset, RobloxUploadError } from "@/lib/roblox-client";
import { formatRobloxAssetName } from "@/lib/name-formatter";
import { isSupportedImageFile } from "@/lib/file-parser";
import type { CreatorType, UploadApiResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();

    const fileCandidate = formData.get("file");
    const creatorId = `${formData.get("creatorId") ?? ""}`.trim();
    const creatorType = `${formData.get("creatorType") ?? "user"}` as CreatorType;
    const apiKeyFromClient = `${formData.get("apiKey") ?? ""}`.trim();
    const displayNameRaw = `${formData.get("displayName") ?? ""}`.trim();

    if (!(fileCandidate instanceof File)) {
      return json(
        { ok: false, error: "No image file was provided." },
        { status: 400 },
      );
    }

    if (!isSupportedImageFile(fileCandidate)) {
      return json(
        {
          ok: false,
          error: "Unsupported image type. Use PNG, JPG, JPEG, or WEBP.",
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

    const apiKey = apiKeyFromClient || process.env.ROBLOX_OPEN_CLOUD_API_KEY;
    if (!apiKey) {
      return json(
        {
          ok: false,
          error:
            "Missing API key. Set it in Settings or ROBLOX_OPEN_CLOUD_API_KEY.",
        },
        { status: 400 },
      );
    }

    const displayName = formatRobloxAssetName(
      displayNameRaw || fileCandidate.name,
    );

    const result = await createRobloxImageAsset({
      apiKey,
      creatorId,
      creatorType,
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
