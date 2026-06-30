import Link from "next/link";
import { IconArrowRight, IconExternal } from "@/components/ui/Icon";
import { TEAMS_CONTACT_EMAIL, docsUrl } from "@/lib/teams/content";
import { siteConfig } from "@/lib/seo/site";

export function TeamsCta() {
  return (
    <section className="bg-[var(--bg-subtle)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="max-w-lg">
            <h2 className="font-display text-xl font-medium tracking-tight text-[var(--text-primary)] sm:text-2xl">
              Self-host on your terms.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              Deploy with Docker, wire your reverse proxy, and point your team at a URL you control.
              Need help rolling it out across a studio?{" "}
              <a href={`mailto:${TEAMS_CONTACT_EMAIL}`} className="link-accent">
                {TEAMS_CONTACT_EMAIL}
              </a>
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            <a href={docsUrl("DEPLOYMENT.md")} className="btn-primary px-6 py-2.5">
              Deploy guide
              <IconExternal size={15} />
            </a>
            <Link href="/workspace" className="btn-secondary px-6 py-2.5">
              Open workspace
              <IconArrowRight size={16} />
            </Link>
            <a
              href={siteConfig.links.github}
              className="btn-ghost px-6 py-2.5"
              target="_blank"
              rel="noopener noreferrer"
            >
              View source
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
