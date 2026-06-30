import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import {
  formatPolicySummary,
  partitionPolicyViolations,
  validateBufferPolicy,
} from "@/lib/policy/validate";
import { DEFAULT_UPLOAD_POLICY } from "@/lib/policy/defaults";
import type { PolicyViolation, UploadPolicyConfig } from "@/lib/types";

const SUPPORTED_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "mp3",
  "ogg",
  "wav",
  "flac",
  "fbx",
  "gltf",
  "glb",
  "rbxm",
  "rbxmx",
  "mesh",
]);

export interface ValidateDirectoryResult {
  ok: boolean;
  filesChecked: number;
  violations: PolicyViolation[];
}

export function collectAssetFiles(dir: string): string[] {
  const resolved = resolve(dir);
  const entries = readdirSync(resolved);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(resolved, entry);
    const stat = statSync(fullPath);
    if (!stat.isFile()) {
      continue;
    }
    const ext = extname(entry).slice(1).toLowerCase();
    if (SUPPORTED_EXT.has(ext)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

export function validateDirectory(
  dir: string,
  policy: UploadPolicyConfig = DEFAULT_UPLOAD_POLICY,
): ValidateDirectoryResult {
  const files = collectAssetFiles(dir);
  const violations: PolicyViolation[] = [];
  const queueNames: string[] = [];

  for (const filePath of files) {
    const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
    const buffer = readFileSync(filePath);
    const fileViolations = validateBufferPolicy(fileName, buffer, {
      policy,
      queueNames,
    });
    violations.push(...fileViolations);
    queueNames.push(fileName.replace(/\.[^.]+$/, ""));
  }

  const { errors } = partitionPolicyViolations(violations);
  return {
    ok: errors.length === 0,
    filesChecked: files.length,
    violations,
  };
}

export function formatValidateReport(result: ValidateDirectoryResult): string {
  const lines = [
    formatPolicySummary(result.violations),
    `Checked ${result.filesChecked} file${result.filesChecked === 1 ? "" : "s"}.`,
  ];

  for (const violation of result.violations) {
    lines.push(
      `[${violation.severity}] ${violation.fileName ?? "file"}: ${violation.message}`,
    );
  }

  return lines.join("\n");
}
