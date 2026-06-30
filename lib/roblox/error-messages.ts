/** Map Roblox / proxy errors to actionable user-facing messages. */

export function translateUploadError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid or unauthorized") ||
    lower.includes("unauthorized") ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return "Invalid or unauthorized API key. Create a key at create.roblox.com with the asset permission scope enabled.";
  }

  if (lower.includes("rate limit") || lower.includes("429")) {
    return "Roblox rate limit reached. Lower parallel uploads in Settings and retry in a minute.";
  }

  if (lower.includes("creator") && lower.includes("invalid")) {
    return "Invalid creator ID. Use a numeric user or group ID that owns this asset type.";
  }

  if (lower.includes("asset scope") || lower.includes("permission")) {
    return "API key missing asset scope. Enable the asset permission when creating your Open Cloud key.";
  }

  if (lower.includes("timed out") || lower.includes("504")) {
    return "Roblox took too long to process this file. Retry — large models may need more time.";
  }

  if (lower.includes("unsupported file")) {
    return message;
  }

  if (lower.includes("missing api key")) {
    return "Add your Open Cloud API key in Settings before uploading.";
  }

  return message;
}
