import { siteConfig } from "@/lib/seo/site";
import { createOgImage, ogImageContentType, ogImageSize } from "@/lib/seo/og-image";

export const alt = `${siteConfig.name} Workspace`;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage({
    badge: `${siteConfig.name} · Workspace`,
    title: "Upload and manage Roblox assets.",
    subtitle: "Batch queue, rbxassetid export, folders, tags, and local library.",
    footer: "uploader.starvsk.dev/workspace",
  });
}
