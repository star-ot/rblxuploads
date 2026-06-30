import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      {icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-[var(--text-muted)]">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
        {description ? <p className="caption max-w-xs">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
