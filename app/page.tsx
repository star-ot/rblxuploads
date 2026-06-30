import type { Metadata } from "next";
import { CredentialManagement } from "@/components/landing/CredentialManagement";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ShowTell } from "@/components/landing/ShowTell";
import { ModelPackages } from "@/components/landing/ModelPackages";
import { InsertServiceStudio } from "@/components/landing/InsertServiceStudio";
import { Faq } from "@/components/landing/Faq";
import { HomePageJsonLd } from "@/components/seo/JsonLd";
import { openGraphImages, twitterImages } from "@/lib/seo/open-graph";
import { absoluteUrl, siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    type: "website",
    images: [...openGraphImages()],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [...twitterImages()],
  },
};

export default function HomePage() {
  return (
    <div className="landing-page flex min-h-dvh flex-col">
      <HomePageJsonLd />
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <CredentialManagement />
        <ShowTell />
        <ModelPackages />
        <InsertServiceStudio />
        <Features />
        <Faq />
      </main>
      <LandingFooter />
    </div>
  );
}
