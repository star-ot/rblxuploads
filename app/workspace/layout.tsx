import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/Toast";
import { WorkspacePageJsonLd } from "@/components/seo/JsonLd";
import { openGraphImages, twitterImages } from "@/lib/seo/open-graph";
import { absoluteUrl, siteConfig } from "@/lib/seo/site";

const workspaceTitle = `${siteConfig.name} Workspace`;
const workspaceDescription =
  "Upload, queue, and manage Roblox assets via Open Cloud. Batch images, audio, models, and meshes with a searchable local library, folders, tags, and rbxassetid export.";

export const metadata: Metadata = {
  title: "Workspace",
  description: workspaceDescription,
  keywords: [
    ...siteConfig.keywords,
    "Roblox upload queue",
    "Roblox asset workspace",
    "Roblox bulk asset upload",
    "rbxassetid copy tool",
  ],
  alternates: {
    canonical: "/workspace",
  },
  openGraph: {
    title: workspaceTitle,
    description: workspaceDescription,
    url: absoluteUrl("/workspace"),
    type: "website",
    images: [...openGraphImages("/workspace/opengraph-image")],
  },
  twitter: {
    card: "summary_large_image",
    title: workspaceTitle,
    description: workspaceDescription,
    images: [...twitterImages("/workspace/twitter-image")],
  },
};

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <WorkspacePageJsonLd />
      {children}
    </ToastProvider>
  );
}
