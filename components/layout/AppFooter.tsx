import Link from "next/link";
import { siteConfig } from "@/lib/seo/site";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-xs leading-relaxed text-[var(--text-faint)]">
          Not affiliated with Roblox Corporation. Independent tool by{" "}
          <a
            href={siteConfig.author.url}
            className="text-[var(--text-faint)] no-underline hover:text-[var(--text-secondary)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            {siteConfig.author.name}
          </a>
          .
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href="/changelog"
            className="text-xs text-[var(--text-faint)] no-underline hover:text-[var(--text-secondary)]"
          >
            Changelog
          </Link>
          <a
            href={siteConfig.links.github}
            className="text-xs text-[var(--text-faint)] no-underline hover:text-[var(--text-secondary)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
          <p className="font-mono text-xs text-[var(--text-faint)]">
            Credentials in browser only · No telemetry
          </p>
        </div>
      </div>
    </footer>
  );
}
