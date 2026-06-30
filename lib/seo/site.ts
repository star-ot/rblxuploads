const DEFAULT_SITE_URL = "https://uploader.starvsk.dev";

export const siteConfig = {
  name: "Studio Vault",
  shortName: "Studio Vault",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, ""),
  title: "Studio Vault — Roblox Asset Workspace",
  description:
    "The asset browser Roblox developers always wanted. Browse, organize, and bulk-upload images, audio, models, and meshes via Open Cloud — including in-place model package updates, InsertService workspace scripts, encrypted multi-profile credentials, and local-first storage. Built for serious Roblox development.",
  tagline: "Find. Organize. Ship.",
  ogImageAlt:
    "Studio Vault — Roblox asset workspace for bulk Open Cloud uploads and local rbxassetid libraries",
  author: {
    name: "StarVSK",
    url: "https://starvsk.dev",
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
    "Roblox rbxassetid library",
    "Roblox InsertService script generator",
    "Roblox model package update",
    "Roblox Open Cloud API",
    "Roblox asset upload tool",
    "Roblox batch image upload",
    "Roblox batch audio upload",
    "Roblox FBX upload",
    "Roblox mesh upload Open Cloud",
    "Roblox creator tools",
    "self-hosted Roblox uploader",
    "Roblox asset pipeline",
    "studio Open Cloud tooling",
    "Roblox enterprise self-host",
    "Docker Roblox uploader",
  ],
  routes: {
    teams: "/teams",
  },
  links: {
    github: "https://github.com/star-ot/studio-vault",
    docsBranch: "master",
    robloxCredentials: "https://create.roblox.com/dashboard/credentials",
  },
} as const;

export function githubDocsUrl(filename: string): string {
  return `${siteConfig.links.github}/blob/${siteConfig.links.docsBranch}/docs/${filename}`;
}

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${normalized}`;
}
