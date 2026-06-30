"use client";

import Link from "next/link";
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        <main className="http-error-main relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
          <div className="hero-grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="http-error-card relative w-full max-w-lg text-center">
            <p className="http-error-code font-mono" aria-hidden>
              500
            </p>
            <h1 className="mt-4 font-display text-2xl font-medium tracking-tight sm:text-3xl">
              Critical error
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
              The app hit a fatal error and could not recover automatically. Reload the page or
              try again in a moment.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button type="button" className="btn-primary px-5 py-2.5 text-[15px]" onClick={reset}>
                Try again
              </button>
              <Link href="/" className="btn-secondary px-5 py-2.5 text-[15px]">
                Back to home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
