import { siteConfig } from "@/lib/seo/site";
import { createOgImage, ogImageContentType, ogImageSize } from "@/lib/seo/og-image";

export const alt = siteConfig.title;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return createOgImage({
    badge: siteConfig.name,
    title: "The asset browser Roblox developers always wanted.",
    subtitle: "Browse, organize, and bulk-upload via Open Cloud. Local-first.",
    footer: "uploader.starvsk.dev",
  });
}
