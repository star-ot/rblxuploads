import Link from "next/link";
import type { ReactNode } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { IconArrowRight } from "@/components/ui/Icon";

interface HttpErrorPageProps {
  code: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function HttpErrorPage({ code, title, description, actions }: HttpErrorPageProps) {
  return (
    <div className="landing-page flex min-h-dvh flex-col">
      <LandingNav />
      <main className="http-error-main relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
        <div className="hero-grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-muted)] blur-3xl"
          aria-hidden
        />

        <div className="http-error-card relative w-full max-w-lg text-center">
          <p className="http-error-code font-mono" aria-hidden>
            {code}
          </p>
          <h1 className="mt-4 font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
            {description}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {actions ?? (
              <>
                <Link href="/" className="btn-primary px-5 py-2.5 text-[15px]">
                  Back to home
                  <IconArrowRight size={16} />
                </Link>
                <Link href="/workspace" className="btn-secondary px-5 py-2.5 text-[15px]">
                  Open workspace
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
