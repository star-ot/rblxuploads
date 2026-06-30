import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  meta?: ReactNode;
}

export function SectionHeader({ title, description, action, meta }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h2 className="font-display text-lg font-medium tracking-tight text-[var(--text-primary)]">
          {title}
        </h2>
        {description ? <p className="caption max-w-prose">{description}</p> : null}
        {meta ? <div className="pt-1 font-mono text-xs text-[var(--text-faint)]">{meta}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
