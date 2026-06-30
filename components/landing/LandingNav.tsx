import Link from "next/link";
import { IconArrowRight } from "@/components/ui/Icon";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-muted)] text-[var(--accent)]"
            aria-hidden
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.9" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" />
            </svg>
          </span>
          <span className="font-display text-[15px] font-medium tracking-tight text-[var(--text-primary)]">
            Studio Vault
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          <a href="#show-tell" className="btn-ghost text-[13px]">
            Demo
          </a>
          <a href="#features" className="btn-ghost text-[13px]">
            Features
          </a>
          <a href="#workflow" className="btn-ghost text-[13px]">
            Workflow
          </a>
          <a href="#faq" className="btn-ghost text-[13px]">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/workspace" className="btn-secondary hidden text-[13px] sm:inline-flex">
            Open workspace
          </Link>
          <Link href="/workspace" className="btn-primary text-[13px]">
            Get started
            <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
