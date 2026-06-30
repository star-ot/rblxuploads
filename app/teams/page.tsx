import type { Metadata } from "next";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { TeamsPageJsonLd } from "@/components/seo/JsonLd";
import { TeamsComparison } from "@/components/teams/TeamsComparison";
import { TeamsCta } from "@/components/teams/TeamsCta";
import { TeamsDeployment } from "@/components/teams/TeamsDeployment";
import { TeamsFaq } from "@/components/teams/TeamsFaq";
import { TeamsHero } from "@/components/teams/TeamsHero";
import { TeamsSecurityDiagram } from "@/components/teams/TeamsSecurityDiagram";
import { TeamsWhyStudios } from "@/components/teams/TeamsWhyStudios";
import { TeamsWorkflows } from "@/components/teams/TeamsWorkflows";
import { openGraphImages, twitterImages } from "@/lib/seo/open-graph";
import { absoluteUrl, siteConfig } from "@/lib/seo/site";

const pageTitle = "Teams & Self-Hosting";
const pageDescription =
  "Self-hosted Roblox asset pipeline for game studios. Docker deploy, security transparency, optional audit logging, and Git-backed team workflows — without multi-tenant SaaS or vendor-held API keys.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    ...siteConfig.keywords,
    "self-hosted Roblox uploader",
    "Roblox asset pipeline",
    "studio Open Cloud tooling",
    "Roblox enterprise self-host",
    "Roblox security review",
    "Docker Roblox uploader",
  ],
  alternates: {
    canonical: "/teams",
  },
  openGraph: {
    title: `${pageTitle} · ${siteConfig.name}`,
    description: pageDescription,
    url: absoluteUrl("/teams"),
    type: "website",
    images: [...openGraphImages()],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} · ${siteConfig.name}`,
    description: pageDescription,
    images: [...twitterImages()],
  },
};

export default function TeamsPage() {
  return (
    <div className="landing-page flex min-h-dvh flex-col">
      <TeamsPageJsonLd />
      <LandingNav />
      <main className="flex-1">
        <TeamsHero />
        <TeamsWhyStudios />
        <TeamsSecurityDiagram />
        <TeamsDeployment />
        <TeamsWorkflows />
        <TeamsComparison />
        <TeamsFaq />
        <TeamsCta />
      </main>
      <LandingFooter />
    </div>
  );
}
