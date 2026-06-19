import { ROBLOX_API_HOST } from "@/lib/config/constants";

interface AppHeaderProps {
  statusMessage?: string;
}

export function AppHeader({ statusMessage }: AppHeaderProps) {
  return (
    <header className="panel panel-accent relative overflow-hidden">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--accent)] opacity-[0.07] blur-2xl" />
      <div className="absolute -bottom-12 left-1/3 h-24 w-48 rounded-full bg-[var(--accent-secondary)] opacity-[0.05] blur-3xl" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="brand-mark" aria-hidden>
              ★
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Roblox Open Cloud · local batch tool
            </p>
          </div>

          <h1 className="font-display text-3xl leading-none tracking-tight text-[var(--text-primary)] md:text-[2.35rem]">
            RblxUploads
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
            Queue files, name them for Roblox, and push them as{" "}
            <span className="text-[var(--text-primary)]">Image or Audio</span> assets
            through Open Cloud. Everything runs on your machine — uploads are the only
            outbound calls.
          </p>
        </div>

        <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
          <p>
            external:{" "}
            <span className="text-[var(--accent-secondary)]">{ROBLOX_API_HOST}</span>
          </p>
          <p className="mt-1">storage: browser localStorage</p>
        </div>
      </div>

      {statusMessage ? (
        <p
          className="relative mt-4 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-text)]"
          role="alert"
        >
          {statusMessage}
        </p>
      ) : null}
    </header>
  );
}
