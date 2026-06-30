import Link from "next/link";
import { siteConfig } from "@/lib/seo/site";

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border-subtle)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <p className="font-display text-[15px] font-medium text-[var(--text-primary)]">
              Studio Vault
            </p>
            <p className="caption leading-relaxed">
              The asset workspace for Roblox developers. Built by{" "}
              <a
                href={siteConfig.author.url}
                className="link-accent"
                target="_blank"
                rel="noopener noreferrer"
              >
                {siteConfig.author.name}
              </a>
              . Open source. Runs locally.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
            <div className="space-y-2">
              <p className="label">Product</p>
              <Link href="/workspace" className="block text-[13px] text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]">
                Workspace
              </Link>
              <Link href="/teams" className="block text-[13px] text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]">
                Teams &amp; self-hosting
              </Link>
              <a href="#faq" className="block text-[13px] text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]">
                FAQ
              </a>
              <Link href="/changelog" className="block text-[13px] text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]">
                Changelog
              </Link>
              <a
                href={siteConfig.links.github}
                className="block text-[13px] text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source code
              </a>
            </div>
            <div className="space-y-2">
              <p className="label">Docs</p>
              <a
                href={`${siteConfig.links.github}/blob/main/docs/SECURITY.md`}
                className="block text-[13px] text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Security
              </a>
              <a
                href={`${siteConfig.links.github}/blob/main/docs/DEPLOYMENT.md`}
                className="block text-[13px] text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Deployment
              </a>
              <a
                href={`${siteConfig.links.github}/blob/main/docs/TEAM-WORKFLOWS.md`}
                className="block text-[13px] text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Team workflows
              </a>
            </div>
            <div className="space-y-2">
              <p className="label">Legal</p>
              <p className="max-w-xs text-[13px] leading-relaxed text-[var(--text-muted)]">
                Not affiliated with Roblox Corporation. Roblox and related marks are
                trademarks of Roblox Corporation.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-[var(--text-faint)]">
            Credentials stay in your browser. No telemetry. No cloud storage.
          </p>
          <p className="font-mono text-xs text-[var(--text-faint)]">MIT License · 2026</p>
        </div>
      </div>
    </footer>
  );
}
