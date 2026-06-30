import { getAssetType, isSupportedAssetFile } from "@/lib/file-parser";
import { formatRobloxAssetName } from "@/lib/name-formatter";
import { DEFAULT_UPLOAD_POLICY } from "@/lib/policy/defaults";
import {
  readImageDimensionsFromBuffer,
  readImageDimensionsFromFile,
  type ImageDimensions,
} from "@/lib/policy/image-dimensions";
import type { PolicyViolation, UploadPolicyConfig } from "@/lib/types";

export interface PolicyValidateInput {
  fileName: string;
  displayName: string;
  mimeType?: string;
  dimensions?: ImageDimensions | null;
}

export interface PolicyValidateOptions {
  policy?: UploadPolicyConfig;
  /** Other display names already in the queue (for duplicate warnings). */
  queueNames?: string[];
}

export function normalizePolicy(policy?: Partial<UploadPolicyConfig>): UploadPolicyConfig {
  return {
    ...DEFAULT_UPLOAD_POLICY,
    ...policy,
  };
}

export function validateAssetPolicy(
  input: PolicyValidateInput,
  options: PolicyValidateOptions = {},
): PolicyViolation[] {
  const policy = normalizePolicy(options.policy);
  if (!policy.enabled) {
    return [];
  }

  const violations: PolicyViolation[] = [];
  const ext = input.fileName.split(".").pop()?.toLowerCase() ?? "";
  const assetType = getAssetTypeFromExtension(ext);

  if (!assetType) {
    violations.push({
      code: "unsupported_type",
      message: `Unsupported file type: .${ext || "unknown"}. Use PNG, JPG, WEBP, MP3, OGG, WAV, FLAC, FBX, GLTF, GLB, RBXM, RBXMX, or MESH.`,
      severity: "error",
      fileName: input.fileName,
    });
    return violations;
  }

  if (policy.maxNameLength > 0 && input.displayName.length > policy.maxNameLength) {
    violations.push({
      code: "name_too_long",
      message: `Display name exceeds ${policy.maxNameLength} characters (${input.displayName.length}).`,
      severity: "error",
      fileName: input.fileName,
      field: "displayName",
    });
  }

  const pattern = policy.namingPattern.trim();
  if (pattern) {
    const fileStem = input.fileName.replace(/\.[^.]+$/, "");
    try {
      const regex = new RegExp(pattern);
      if (!regex.test(fileStem)) {
        violations.push({
          code: "naming_pattern",
          message: `File "${input.fileName}" does not match pattern ${pattern}.`,
          severity: "error",
          fileName: input.fileName,
          field: "fileName",
        });
      }
    } catch {
      violations.push({
        code: "invalid_pattern",
        message: `Naming pattern is not a valid regular expression: ${pattern}`,
        severity: "error",
        field: "namingPattern",
      });
    }
  }

  if (assetType === "Image" && input.dimensions) {
    const { width, height } = input.dimensions;
    if (policy.imageMaxWidth && width > policy.imageMaxWidth) {
      violations.push({
        code: "image_too_wide",
        message: `Image width ${width}px exceeds max ${policy.imageMaxWidth}px.`,
        severity: "error",
        fileName: input.fileName,
      });
    }
    if (policy.imageMaxHeight && height > policy.imageMaxHeight) {
      violations.push({
        code: "image_too_tall",
        message: `Image height ${height}px exceeds max ${policy.imageMaxHeight}px.`,
        severity: "error",
        fileName: input.fileName,
      });
    }
    if (policy.imageMinWidth && width < policy.imageMinWidth) {
      violations.push({
        code: "image_too_narrow",
        message: `Image width ${width}px is below min ${policy.imageMinWidth}px.`,
        severity: "error",
        fileName: input.fileName,
      });
    }
    if (policy.imageMinHeight && height < policy.imageMinHeight) {
      violations.push({
        code: "image_too_short",
        message: `Image height ${height}px is below min ${policy.imageMinHeight}px.`,
        severity: "error",
        fileName: input.fileName,
      });
    }
  }

  if (policy.warnDuplicateNames && options.queueNames?.length) {
    const normalized = input.displayName.trim().toLowerCase();
    const dupes = options.queueNames.filter(
      (name) => name.trim().toLowerCase() === normalized,
    );
    if (dupes.length > 0) {
      violations.push({
        code: "duplicate_name",
        message: `Duplicate display name "${input.displayName}" already in queue.`,
        severity: policy.blockOnViolation ? "error" : "warning",
        fileName: input.fileName,
        field: "displayName",
      });
    }
  }

  return violations;
}

export async function validateFilePolicy(
  file: File,
  options: PolicyValidateOptions = {},
): Promise<PolicyViolation[]> {
  const displayName = formatRobloxAssetName(file.name);
  let dimensions: ImageDimensions | null = null;

  if (file.type.startsWith("image/")) {
    dimensions = await readImageDimensionsFromFile(file);
  }

  return validateAssetPolicy(
    {
      fileName: file.name,
      displayName,
      mimeType: file.type,
      dimensions,
    },
    options,
  );
}

export function validateBufferPolicy(
  fileName: string,
  buffer: Buffer,
  options: PolicyValidateOptions = {},
): PolicyViolation[] {
  const displayName = formatRobloxAssetName(fileName);
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const isImage = ["png", "jpg", "jpeg", "webp"].includes(ext);
  const dimensions = isImage ? readImageDimensionsFromBuffer(buffer) : null;

  return validateAssetPolicy(
    {
      fileName,
      displayName,
      dimensions,
    },
    options,
  );
}

export function partitionPolicyViolations(violations: PolicyViolation[]): {
  errors: PolicyViolation[];
  warnings: PolicyViolation[];
} {
  return {
    errors: violations.filter((v) => v.severity === "error"),
    warnings: violations.filter((v) => v.severity === "warning"),
  };
}

export function formatPolicySummary(violations: PolicyViolation[]): string {
  if (!violations.length) {
    return "All files passed policy checks.";
  }
  const { errors, warnings } = partitionPolicyViolations(violations);
  const parts: string[] = [];
  if (errors.length) {
    parts.push(`${errors.length} error${errors.length === 1 ? "" : "s"}`);
  }
  if (warnings.length) {
    parts.push(`${warnings.length} warning${warnings.length === 1 ? "" : "s"}`);
  }
  return parts.join(", ");
}

function getAssetTypeFromExtension(ext: string) {
  const fakeFile = { name: `x.${ext}`, type: "" } as File;
  if (!isSupportedAssetFile(fakeFile)) {
    return null;
  }
  return getAssetType(fakeFile);
}
