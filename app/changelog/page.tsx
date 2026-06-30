import type { Metadata } from "next";
import { ChangelogHeader } from "@/components/changelog/ChangelogHeader";
import { ChangelogTimeline } from "@/components/changelog/ChangelogTimeline";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LATEST_RELEASE } from "@/lib/changelog";
import { openGraphImages, twitterImages } from "@/lib/seo/open-graph";
import { absoluteUrl, siteConfig } from "@/lib/seo/site";

const pageTitle = "Changelog";
const pageDescription = `What's new in ${siteConfig.name}. Release notes for v${LATEST_RELEASE.version} and earlier — features, fixes, and improvements.`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: `${pageTitle} · ${siteConfig.name}`,
    description: pageDescription,
    url: absoluteUrl("/changelog"),
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

export default function ChangelogPage() {
  return (
    <div className="landing-page flex min-h-dvh flex-col">
      <ChangelogHeader />
      <main className="flex-1">
        <section className="border-b border-[var(--border-subtle)]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <p className="label mb-3">Changelog</p>
            <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--text-primary)] sm:text-4xl">
              What&apos;s new
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
              Release history for {siteConfig.name}. Latest version{" "}
              <span className="font-mono text-[var(--text-secondary)]">
                v{LATEST_RELEASE.version}
              </span>
              .
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <ChangelogTimeline />
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
