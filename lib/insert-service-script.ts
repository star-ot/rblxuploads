export type InsertScriptParent =
  | "Workspace"
  | "ReplicatedStorage"
  | "ServerStorage"
  | "ServerScriptService";

export type InsertScriptLayout = "origin" | "line" | "grid";

export type InsertScriptFormat = "server" | "command-bar" | "module";

export type InsertScriptAssetKind = "audio" | "package";

export interface InsertScriptAsset {
  name: string;
  assetId: string;
  type: string;
}

export interface InsertScriptOptions {
  parent: InsertScriptParent;
  subfolder: string;
  layout: InsertScriptLayout;
  spacing: number;
  gridColumns: number;
  format: InsertScriptFormat;
  pivotToGround: boolean;
  usePcall: boolean;
  includeComments: boolean;
  soundVolume: number;
  soundLooped: boolean;
  soundPlayOnInsert: boolean;
  soundRollOffMaxDistance: number;
}

export const INSERTABLE_STUDIO_ASSET_TYPES = ["Audio", "Model", "Mesh"] as const;

export type InsertableStudioAssetType = (typeof INSERTABLE_STUDIO_ASSET_TYPES)[number];

export const DEFAULT_INSERT_SCRIPT_OPTIONS: InsertScriptOptions = {
  parent: "Workspace",
  subfolder: "",
  layout: "line",
  spacing: 16,
  gridColumns: 4,
  format: "server",
  pivotToGround: true,
  usePcall: true,
  includeComments: true,
  soundVolume: 1,
  soundLooped: false,
  soundPlayOnInsert: false,
  soundRollOffMaxDistance: 10_000,
};

export function isInsertableStudioAsset(type: string): type is InsertableStudioAssetType {
  return (INSERTABLE_STUDIO_ASSET_TYPES as readonly string[]).includes(type);
}

export function getInsertAssetKind(type: string): InsertScriptAssetKind {
  return type === "Audio" ? "audio" : "package";
}

function escapeLuaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function parentExpression(options: InsertScriptOptions): string {
  const root = `game:GetService("${options.parent}")`;
  const sub = options.subfolder.trim();
  if (!sub) {
    return root;
  }
  const parts = sub.split(".").map((part) => part.trim()).filter(Boolean);
  return parts.reduce((expr, part) => `${expr}:WaitForChild("${escapeLuaString(part)}")`, root);
}

function positionExpression(options: InsertScriptOptions): string {
  const spacing = Math.max(0, options.spacing);
  switch (options.layout) {
    case "origin":
      return "Vector3.zero";
    case "grid": {
      const columns = Math.max(1, options.gridColumns);
      return `Vector3.new((index - 1) % ${columns} * ${spacing}, 0, math.floor((index - 1) / ${columns}) * ${spacing})`;
    }
    case "line":
    default:
      return `Vector3.new((index - 1) * ${spacing}, 0, 0)`;
  }
}

function buildAssetTable(assets: InsertScriptAsset[], includeComments: boolean): string {
  return assets
    .map((asset) => {
      const kind = getInsertAssetKind(asset.type);
      const comment = includeComments ? ` -- ${asset.type}: ${asset.name}` : "";
      return `\t{ id = ${asset.assetId}, name = "${escapeLuaString(asset.name)}", kind = "${kind}" },${comment}`;
    })
    .join("\n");
}

function soundConstants(options: InsertScriptOptions): string {
  const volume = Math.min(1, Math.max(0, options.soundVolume));
  const rollOff = Math.max(0, options.soundRollOffMaxDistance);
  return `local SOUND_VOLUME = ${volume}
local SOUND_LOOPED = ${options.soundLooped ? "true" : "false"}
local SOUND_PLAY_ON_INSERT = ${options.soundPlayOnInsert ? "true" : "false"}
local SOUND_ROLLOFF_MAX = ${rollOff}`;
}

function sharedHelpers(options: InsertScriptOptions, indent: string): string {
  const positionExpr = positionExpression(options);
  const pivotBlock = options.pivotToGround
    ? `${indent}local primary = instance:IsA("Model") and instance.PrimaryPart
${indent}if primary then
${indent}\tlocal _, size = instance:GetBoundingBox()
${indent}\tinstance:PivotTo(CFrame.new(offset + Vector3.new(0, size.Y / 2, 0)))
${indent}else
${indent}\tinstance:PivotTo(CFrame.new(offset))
${indent}end`
    : `${indent}instance:PivotTo(CFrame.new(offset))`;

  return `${indent}local function insertSound(entry)
${indent}\tlocal sound = Instance.new("Sound")
${indent}\tsound.Name = entry.name
${indent}\tsound.SoundId = "rbxassetid://" .. entry.id
${indent}\tsound.Volume = SOUND_VOLUME
${indent}\tsound.Looped = SOUND_LOOPED
${indent}\tsound.RollOffMaxDistance = SOUND_ROLLOFF_MAX
${indent}\tsound.Parent = PARENT
${indent}\tif SOUND_PLAY_ON_INSERT then
${indent}\t\tsound:Play()
${indent}\tend
${indent}\treturn sound
${indent}end

${indent}local function resolvePackage(loaded: Instance): Instance
${indent}\tif loaded:IsA("Model") or loaded:IsA("MeshPart") or loaded:IsA("Folder") then
${indent}\t\treturn loaded
${indent}\tend
${indent}\tlocal model = loaded:FindFirstChildWhichIsA("Model", true)
${indent}\treturn model or loaded
${indent}end

${indent}local function insertPackage(entry, index: number)
${options.usePcall
    ? `${indent}\tlocal ok, loaded = pcall(function()
${indent}\t\treturn InsertService:LoadAsset(entry.id)
${indent}\tend)
${indent}\tif not ok or not loaded then
${indent}\t\twarn("[StudioVault] Failed to load", entry.name, entry.id)
${indent}\t\treturn nil
${indent}\tend`
    : `${indent}\tlocal loaded = InsertService:LoadAsset(entry.id)`}
${indent}\tlocal instance = resolvePackage(loaded)
${indent}\tinstance.Name = entry.name
${indent}\tlocal offset = ${positionExpr}
${pivotBlock}
${indent}\tinstance.Parent = PARENT
${indent}\treturn instance
${indent}end`;
}

function buildLoaderBody(
  assets: InsertScriptAsset[],
  options: InsertScriptOptions,
): string {
  const parentExpr = parentExpression(options);
  const assetTable = buildAssetTable(assets, options.includeComments);
  const audioCount = assets.filter((asset) => getInsertAssetKind(asset.type) === "audio").length;
  const packageCount = assets.length - audioCount;
  const summaryParts: string[] = [];
  if (packageCount > 0) {
    summaryParts.push(`${packageCount} package${packageCount === 1 ? "" : "s"}`);
  }
  if (audioCount > 0) {
    summaryParts.push(`${audioCount} sound${audioCount === 1 ? "" : "s"}`);
  }

  return `-- Studio Vault · Studio asset loader
-- Generated ${new Date().toISOString().slice(0, 10)} · ${summaryParts.join(" · ")}
-- Paste into ServerScriptService (Play Solo) or run from Studio Command Bar.

local InsertService = game:GetService("InsertService")

local PARENT = ${parentExpr}
${soundConstants(options)}

local ASSETS = {
${assetTable}
}

${sharedHelpers(options, "")}

local loadedCount = 0

for index, entry in ipairs(ASSETS) do
\tif entry.kind == "audio" then
\t\tinsertSound(entry)
\t\tloadedCount += 1
\telse
\t\tlocal instance = insertPackage(entry, index)
\t\tif instance then
\t\t\tloadedCount += 1
\t\tend
\tend
end

print("[StudioVault] Inserted", loadedCount, "asset(s) into", PARENT:GetFullName())`;
}

function buildCommandBarScript(
  assets: InsertScriptAsset[],
  options: InsertScriptOptions,
): string {
  const parentExpr = parentExpression(options);
  const positionExpr = positionExpression(options);
  const volume = Math.min(1, Math.max(0, options.soundVolume));
  const entries = assets
    .map((asset) => {
      const kind = getInsertAssetKind(asset.type);
      return `{${asset.assetId},"${escapeLuaString(asset.name)}","${kind}"${options.includeComments ? ` -- ${asset.type}` : ""}}`;
    })
    .join(", ");

  return `-- Studio Vault · Command Bar (Studio only)
local InsertService,P=game:GetService("InsertService"),${parentExpr}
local ASSETS={${entries}}
for index,entry in ipairs(ASSETS) do
\tif entry[3]=="audio" then
\t\tlocal s=Instance.new("Sound") s.Name=entry[2] s.SoundId="rbxassetid://"..entry[1] s.Volume=${volume} s.Looped=${options.soundLooped} s.RollOffMaxDistance=${options.soundRollOffMaxDistance} s.Parent=P${options.soundPlayOnInsert ? " s:Play()" : ""}
\telse
\t\tlocal loaded=InsertService:LoadAsset(entry[1]) loaded.Name=entry[2] local offset=${positionExpr}
\t\tif loaded:IsA("Model") and loaded.PrimaryPart then local _,sz=loaded:GetBoundingBox() loaded:PivotTo(CFrame.new(offset+Vector3.new(0,sz.Y/2,0))) else loaded:PivotTo(CFrame.new(offset)) end
\t\tloaded.Parent=P
\tend
end`;
}

function buildModuleScript(
  assets: InsertScriptAsset[],
  options: InsertScriptOptions,
): string {
  const parentExpr = parentExpression(options);
  const assetTable = buildAssetTable(assets, options.includeComments);

  return `-- Studio Vault · Studio asset loader module
-- require(script).loadAll() from ServerScriptService or a Studio plugin.

local InsertService = game:GetService("InsertService")

local DEFAULT_PARENT = ${parentExpr}
${soundConstants(options)}

local ASSETS = {
${assetTable}
}

local PARENT = DEFAULT_PARENT

local StudioLoader = {}

${sharedHelpers(options, "")}

function StudioLoader.loadAll(parent: Instance?)
\tPARENT = parent or DEFAULT_PARENT
\tlocal loadedCount = 0

\tfor index, entry in ipairs(ASSETS) do
\t\tif entry.kind == "audio" then
\t\t\tinsertSound(entry)
\t\t\tloadedCount += 1
\t\telse
\t\t\tlocal instance = insertPackage(entry, index)
\t\t\tif instance then
\t\t\t\tloadedCount += 1
\t\t\tend
\t\tend
\tend

\treturn loadedCount
end

function StudioLoader.getAssets()
\treturn ASSETS
end

return StudioLoader`;
}

export function buildInsertServiceScript(
  assets: InsertScriptAsset[],
  options: InsertScriptOptions = DEFAULT_INSERT_SCRIPT_OPTIONS,
): string {
  if (!assets.length) {
    return "-- Select one or more audio or package assets to generate a Studio loader.";
  }

  switch (options.format) {
    case "command-bar":
      return buildCommandBarScript(assets, options);
    case "module":
      return buildModuleScript(assets, options);
    case "server":
    default:
      return buildLoaderBody(assets, options);
  }
}

export function getInsertScriptFilename(assets: InsertScriptAsset[]): string {
  const slug =
    assets.length === 1
      ? assets[0].name.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40)
      : `batch_${assets.length}`;
  return `StudioVault_Load_${slug}.lua`;
}

export function countInsertScriptAssets(assets: InsertScriptAsset[]): {
  audio: number;
  packages: number;
  total: number;
} {
  const audio = assets.filter((asset) => getInsertAssetKind(asset.type) === "audio").length;
  return {
    audio,
    packages: assets.length - audio,
    total: assets.length,
  };
}
