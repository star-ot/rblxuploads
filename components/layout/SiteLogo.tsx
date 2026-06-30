import Link from "next/link";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  /** Hide wordmark on the narrowest viewports to leave room for nav controls. */
  compact?: boolean;
}

export function SiteLogo({ className, compact = false }: SiteLogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 no-underline", className)}>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent-muted)] text-[var(--accent)]"
        aria-hidden
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.9" />
          <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" />
          <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" />
          <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" />
        </svg>
      </span>
      <span
        className={cn(
          "font-display text-[15px] font-medium tracking-tight text-[var(--text-primary)]",
          compact && "max-sm:hidden",
        )}
      >
        Studio Vault
      </span>
    </Link>
  );
}
