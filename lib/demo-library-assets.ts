import { createDemoImageThumbnail, createDemoThumbnail } from "@/lib/demo-placeholders";
import type { AssetType, LocalAssetRecord } from "@/lib/types";

export const DEMO_LIBRARY_ASSETS: LocalAssetRecord[] = [
  {
    id: "demo-1",
    name: "UI_IconInventory",
    type: "Image",
    assetId: "18472930102",
    assetUri: "rbxassetid://18472930102",
    thumbnailDataUrl: createDemoImageThumbnail("inventory", 214),
    fileName: "icon_inventory.png",
    folderPath: "Assets/UI/Icons",
    tags: ["ui", "icons", "inventory"],
    createdAt: 1_704_000_000_000,
    updatedAt: 1_704_000_000_000,
  },
  {
    id: "demo-2",
    name: "SFX_ClickSoft",
    type: "Audio",
    assetId: "9123847102",
    assetUri: "rbxassetid://9123847102",
    thumbnailDataUrl: createDemoThumbnail("Audio", 1),
    fileName: "click_soft.ogg",
    folderPath: "Assets/Audio/UI",
    tags: ["sfx", "ui", "click"],
    createdAt: 1_703_500_000_000,
    updatedAt: 1_703_500_000_000,
  },
  {
    id: "demo-3",
    name: "Char_HeroMesh",
    type: "Mesh",
    assetId: "7729103845",
    assetUri: "rbxassetid://7729103845",
    thumbnailDataUrl: createDemoThumbnail("Mesh", 2),
    fileName: "hero_body.mesh",
    folderPath: "Assets/Characters/Hero",
    tags: ["character", "hero", "mesh"],
    createdAt: 1_703_000_000_000,
    updatedAt: 1_703_000_000_000,
  },
  {
    id: "demo-4",
    name: "Env_TreeCluster",
    type: "Model",
    assetId: "6612049381",
    assetUri: "rbxassetid://6612049381",
    thumbnailDataUrl: createDemoThumbnail("Model", 3),
    fileName: "tree_cluster.rbxm",
    folderPath: "Assets/World/Nature",
    tags: ["environment", "nature", "foliage"],
    createdAt: 1_702_500_000_000,
    updatedAt: 1_702_500_000_000,
  },
  {
    id: "demo-5",
    name: "UI_IconSettings",
    type: "Image",
    assetId: "18472930188",
    assetUri: "rbxassetid://18472930188",
    thumbnailDataUrl: createDemoImageThumbnail("settings", 248),
    fileName: "icon_settings.png",
    folderPath: "Assets/UI/Icons",
    tags: ["ui", "icons", "settings"],
    createdAt: 1_702_000_000_000,
    updatedAt: 1_702_000_000_000,
  },
  {
    id: "demo-6",
    name: "Music_LobbyLoop",
    type: "Audio",
    assetId: "9123847999",
    assetUri: "rbxassetid://9123847999",
    thumbnailDataUrl: createDemoThumbnail("Audio", 4),
    fileName: "lobby_loop.mp3",
    folderPath: "Assets/Audio/Music",
    tags: ["music", "lobby", "loop"],
    createdAt: 1_701_500_000_000,
    updatedAt: 1_701_500_000_000,
  },
];

export function matchesLibrarySearch(asset: LocalAssetRecord, searchText: string): boolean {
  const query = searchText.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const haystack = [
    asset.name,
    asset.assetId,
    asset.assetUri,
    asset.fileName,
    asset.folderPath,
    asset.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function filterDemoLibraryAssets(
  assets: LocalAssetRecord[],
  options: {
    search: string;
    typeFilter: AssetType | "all";
    folderFilter: string | "all";
  },
): LocalAssetRecord[] {
  return assets.filter((asset) => {
    if (options.typeFilter !== "all" && asset.type !== options.typeFilter) {
      return false;
    }
    if (
      options.folderFilter !== "all" &&
      asset.folderPath !== options.folderFilter &&
      !asset.folderPath.startsWith(`${options.folderFilter}/`)
    ) {
      return false;
    }
    return matchesLibrarySearch(asset, options.search);
  });
}

export function getAssetTypeGlyph(type: AssetType): string {
  switch (type) {
    case "Audio":
      return "A";
    case "Model":
      return "M";
    case "Mesh":
      return "X";
    case "Image":
    default:
      return "I";
  }
}
