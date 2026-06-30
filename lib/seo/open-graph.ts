import { absoluteUrl, siteConfig } from "@/lib/seo/site";

export function openGraphImages(path: "/opengraph-image" | "/workspace/opengraph-image" = "/opengraph-image") {
  const alt =
    path === "/workspace/opengraph-image"
      ? `${siteConfig.name} Workspace — Roblox asset upload queue`
      : siteConfig.title;

  return [
    {
      url: absoluteUrl(path),
      width: 1200,
      height: 630,
      alt,
      type: "image/png",
    },
  ] as const;
}

export function twitterImages(path: "/twitter-image" | "/workspace/twitter-image" = "/twitter-image") {
  return [absoluteUrl(path)] as const;
}
