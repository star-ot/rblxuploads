export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 text-xs text-[var(--text-muted)]">
        <p className="leading-relaxed">
          Not affiliated with, endorsed by, or sponsored by Roblox Corporation.
          Roblox and related marks are trademarks of Roblox Corporation.
          This is an independent community tool by{" "}
          <span className="font-medium text-[var(--text-secondary)]">StarVSK</span>.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Open source — credentials stay in your browser, never on our servers.
          </p>
          <p className="font-mono">rblxuploads · no telemetry · no cloud deps</p>
        </div>
      </div>
    </footer>
  );
}
