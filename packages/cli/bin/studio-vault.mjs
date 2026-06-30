#!/usr/bin/env node
/**
 * Studio Vault CLI — headless Open Cloud uploads for CI/CD.
 * Usage: studio-vault upload ./assets --profile main --concurrency 5 --format json
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp"]);
const AUDIO_EXT = new Set(["mp3", "ogg", "wav", "flac"]);
const MODEL_EXT = new Set(["fbx", "gltf", "glb", "rbxm", "rbxmx"]);
const MESH_EXT = new Set(["mesh"]);

const ROBLOX_BASE = "https://apis.roblox.com/assets/v1";
const POLL_MS = 1500;
const MAX_POLLS = 20;

function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  void runCommand(command, args).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    emitJson({ ok: false, error: message, event: "cli.error" });
    process.exit(2);
  });
}

async function runCommand(command, args) {
  try {
    if (command === "upload") {
      await runUpload(args);
      return;
    }
    if (command === "patch") {
      await runPatch(args);
      return;
    }
    if (command === "library") {
      runLibrary(args);
      return;
    }
    if (command === "validate") {
      await runValidate(args);
      return;
    }
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(2);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emitJson({ ok: false, error: message, event: "cli.error" });
    process.exit(2);
  }
}

function printHelp() {
  console.log(`studio-vault — headless Roblox Open Cloud uploads

Commands:
  upload <dir> [--profile <name>] [--concurrency <n>] [--format json|text]
  patch --asset-id <id> --file <path> [--profile <name>] [--format json|text]
  library export <output.json> [--from <library.json>]
  validate <dir> [--pattern <regex>] [--max-name-length <n>] [--block]

Credentials (env or studio-vault.json):
  ROBLOX_OPEN_CLOUD_KEY, ROBLOX_CREATOR_ID, ROBLOX_CREATOR_TYPE
  --config studio-vault.json

Exit codes: 0 success, 1 partial failure, 2 config error
`);
}

function parseFlags(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i += 1;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function loadConfig(flags) {
  const configPath = flags.config || "studio-vault.json";
  let fileConfig = {};
  try {
    fileConfig = JSON.parse(readFileSync(resolve(configPath), "utf8"));
  } catch {
  }

  const profiles = fileConfig.profiles ?? {};
  const profileName = flags.profile || fileConfig.defaultProfile || "default";
  const profile = profiles[profileName] ?? {};

  const apiKey =
    process.env.ROBLOX_OPEN_CLOUD_KEY?.trim() ||
    profile.apiKey?.trim() ||
    fileConfig.apiKey?.trim();
  const creatorId =
    process.env.ROBLOX_CREATOR_ID?.trim() ||
    profile.creatorId?.trim() ||
    fileConfig.creatorId?.trim();
  const creatorType =
    process.env.ROBLOX_CREATOR_TYPE?.trim() ||
    profile.creatorType?.trim() ||
    fileConfig.creatorType?.trim() ||
    "user";

  if (!apiKey || !creatorId) {
    throw new Error(
      "Missing credentials. Set ROBLOX_OPEN_CLOUD_KEY and ROBLOX_CREATOR_ID or use --config studio-vault.json",
    );
  }

  if (!/^\d+$/.test(creatorId)) {
    throw new Error("ROBLOX_CREATOR_ID must be numeric.");
  }

  if (creatorType !== "user" && creatorType !== "group") {
    throw new Error("ROBLOX_CREATOR_TYPE must be user or group.");
  }

  return { apiKey, creatorId, creatorType, profileName };
}

function getAssetType(filePath) {
  const ext = extname(filePath).slice(1).toLowerCase();
  if (IMAGE_EXT.has(ext)) return "Image";
  if (AUDIO_EXT.has(ext)) return "Audio";
  if (MODEL_EXT.has(ext)) return "Model";
  if (MESH_EXT.has(ext)) return "Mesh";
  return null;
}

function formatName(filePath) {
  const base = basename(filePath, extname(filePath));
  return base.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").slice(0, 100);
}

function collectFiles(dir) {
  const abs = resolve(dir);
  const entries = readdirSync(abs);
  const files = [];
  for (const entry of entries) {
    const full = join(abs, entry);
    if (statSync(full).isDirectory()) continue;
    if (getAssetType(full)) files.push(full);
  }
  return files.sort();
}

async function runUpload(argv) {
  const { flags, positional } = parseFlags(argv);
  const dir = positional[0];
  if (!dir) throw new Error("upload requires a directory path.");

  const config = loadConfig(flags);
  const concurrency = Math.max(1, Math.min(10, Number(flags.concurrency) || 5));
  const format = flags.format === "text" ? "text" : "json";
  const files = collectFiles(dir);

  if (!files.length) {
    throw new Error(`No supported assets found in ${dir}`);
  }

  let failures = 0;
  let index = 0;

  async function worker() {
    while (index < files.length) {
      const fileIndex = index;
      index += 1;
      const filePath = files[fileIndex];
      const assetType = getAssetType(filePath);
      const displayName = formatName(filePath);

      try {
        const result = await createAsset({
          ...config,
          filePath,
          assetType,
          displayName,
        });
        emitResult(format, {
          ok: true,
          event: "asset.create",
          file: filePath,
          assetType,
          displayName,
          assetId: result.assetId,
          operationId: result.operationId,
        });
      } catch (error) {
        failures += 1;
        emitResult(format, {
          ok: false,
          event: "asset.create",
          file: filePath,
          assetType,
          displayName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  process.exit(failures > 0 ? 1 : 0);
}

async function runPatch(argv) {
  const { flags } = parseFlags(argv);
  const assetId = flags["asset-id"];
  const filePath = flags.file;
  if (!assetId || !filePath) {
    throw new Error("patch requires --asset-id and --file");
  }
  if (extname(filePath).toLowerCase() !== ".fbx") {
    throw new Error("patch only supports FBX files.");
  }

  const config = loadConfig(flags);
  const format = flags.format === "text" ? "text" : "json";
  const displayName = formatName(filePath);

  try {
    const result = await patchModel({
      ...config,
      assetId,
      filePath,
      displayName,
    });
    emitResult(format, {
      ok: true,
      event: "asset.patch",
      file: filePath,
      assetId: result.assetId,
      operationId: result.operationId,
    });
    process.exit(0);
  } catch (error) {
    emitResult(format, {
      ok: false,
      event: "asset.patch",
      file: filePath,
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

function runLibrary(argv) {
  const { flags, positional } = parseFlags(argv);
  const sub = positional[0];
  if (sub !== "export") {
    throw new Error("library subcommand: export <output.json> [--from <library.json>]");
  }

  const output = positional[1];
  const from = flags.from;
  if (!output) throw new Error("library export requires output path.");

  if (from) {
    const payload = readFileSync(resolve(from), "utf8");
    writeFileSync(resolve(output), payload);
    emitJson({ ok: true, event: "library.export", output, source: from });
    process.exit(0);
  }

  const empty = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    folders: ["Library"],
    assets: [],
  };
  writeFileSync(resolve(output), JSON.stringify(empty, null, 2));
  emitJson({ ok: true, event: "library.export", output, assets: 0 });
  process.exit(0);
}

async function createAsset({ apiKey, creatorId, creatorType, filePath, assetType, displayName }) {
  const { readFile } = await import("node:fs/promises");
  const buffer = await readFile(filePath);
  const blob = new Blob([buffer]);
  const file = new File([blob], basename(filePath));

  const formData = new FormData();
  formData.append(
    "request",
    JSON.stringify({
      assetType,
      displayName,
      description: `Uploaded via studio-vault CLI: ${displayName}`,
      creationContext: {
        creator:
          creatorType === "group"
            ? { groupId: creatorId }
            : { userId: creatorId },
      },
    }),
  );
  formData.append("fileContent", file, basename(filePath));

  const response = await fetch(`${ROBLOX_BASE}/assets`, {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractError(payload) || `Upload failed (${response.status})`);
  }

  const operationId =
    payload.path?.split("/").filter(Boolean).at(-1) ?? payload.response?.assetId;
  if (!operationId) throw new Error("No operation ID from Roblox.");

  const operation = await pollOperation(apiKey, operationId);
  const assetId = operation.response?.assetId;
  if (!assetId) throw new Error("Roblox completed without asset ID.");

  return { operationId, assetId };
}

async function patchModel({ apiKey, creatorId, creatorType, assetId, filePath, displayName }) {
  const { readFile } = await import("node:fs/promises");
  const buffer = await readFile(filePath);
  const blob = new Blob([buffer]);
  const file = new File([blob], basename(filePath));

  const formData = new FormData();
  formData.append(
    "request",
    JSON.stringify({
      assetType: "Model",
      assetId: Number(assetId),
      displayName,
      creationContext: {
        creator:
          creatorType === "group"
            ? { groupId: creatorId }
            : { userId: creatorId },
      },
    }),
  );
  formData.append("fileContent", file, basename(filePath));

  const response = await fetch(`${ROBLOX_BASE}/assets/${encodeURIComponent(assetId)}`, {
    method: "PATCH",
    headers: { "x-api-key": apiKey },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractError(payload) || `Patch failed (${response.status})`);
  }

  const operationId =
    payload.path?.split("/").filter(Boolean).at(-1) ?? payload.response?.assetId;
  if (!operationId) throw new Error("No operation ID from Roblox.");

  const operation = await pollOperation(apiKey, operationId);
  return {
    operationId,
    assetId: operation.response?.assetId ?? assetId,
  };
}

async function pollOperation(apiKey, operationId) {
  for (let i = 0; i < MAX_POLLS; i += 1) {
    const response = await fetch(`${ROBLOX_BASE}/operations/${operationId}`, {
      headers: { "x-api-key": apiKey },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(extractError(payload) || "Failed polling operation.");
    }
    if (payload.done) return payload;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error("Timed out waiting for Roblox.");
}

function extractError(payload) {
  return (
    payload?.error?.message ||
    payload?.message ||
    payload?.errors?.[0]?.message ||
    null
  );
}

function emitJson(obj) {
  console.log(JSON.stringify(obj));
}

function emitResult(format, obj) {
  if (format === "text") {
    if (obj.ok) {
      console.log(`${obj.file} → rbxassetid://${obj.assetId}`);
    } else {
      console.error(`${obj.file} FAILED: ${obj.error}`);
    }
    return;
  }
  emitJson(obj);
}

async function runValidate(argv) {
  const { spawnSync } = await import("node:child_process");
  const { dirname, join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const script = join(root, "scripts/validate-assets.ts");
  const result = spawnSync("npx", ["tsx", script, ...argv], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  process.exit(result.status ?? 1);
}

main();
