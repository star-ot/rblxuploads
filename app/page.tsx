import type { Metadata } from "next";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Faq } from "@/components/landing/Faq";
import { HomePageJsonLd } from "@/components/seo/JsonLd";
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
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [absoluteUrl("/twitter-image")],
  },
};

export default function HomePage() {
  return (
    <div className="landing-page flex min-h-dvh flex-col">
      <HomePageJsonLd />
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <Features />
        <Faq />
      </main>
      <LandingFooter />
    </div>
  );
}
