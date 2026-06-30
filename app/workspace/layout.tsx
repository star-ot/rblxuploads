import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Workspace",
  description:
    "Upload, queue, and manage Roblox assets via Open Cloud. Batch images, audio, models, and meshes with a searchable local library.",
  keywords: [
    ...siteConfig.keywords,
    "Roblox upload queue",
    "Roblox asset workspace",
  ],
  alternates: {
    canonical: "/workspace",
  },
  openGraph: {
    title: `${siteConfig.name} Workspace`,
    description:
      "Upload and manage Roblox assets. Queue batch uploads, copy rbxassetid values, and organize your local library.",
    url: absoluteUrl("/workspace"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} Workspace`,
    description:
      "Upload and manage Roblox assets. Queue batch uploads, copy rbxassetid values, and organize your local library.",
  },
};

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
