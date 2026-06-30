const DEFAULT_SITE_URL = "https://uploader.starvsk.dev";

export const siteConfig = {
  name: "Studio Vault",
  shortName: "Studio Vault",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, ""),
  title: "Studio Vault — Roblox Asset Workspace",
  description:
    "The asset browser Roblox developers always wanted. Browse, organize, and bulk-upload images, audio, models, and meshes via Open Cloud. Local-first. Built for serious Roblox development.",
  tagline: "Find. Organize. Ship.",
  author: {
    name: "StarVSK",
    url: "https://github.com/star-ot",
  },
  keywords: [
    "Roblox asset manager",
    "Roblox asset library",
    "Roblox asset browser",
    "Roblox Open Cloud uploader",
    "Roblox bulk upload",
    "rbxassetid manager",
    "Roblox developer tools",
    "Roblox image upload",
    "Roblox audio upload",
    "Roblox model upload",
    "Roblox mesh upload",
    "UGC creator tools",
    "Roblox studio assets",
    "Creator Dashboard alternative",
    "local Roblox asset workspace",
  ],
} as const;

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${normalized}`;
}
