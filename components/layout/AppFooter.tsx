export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p>
          Made by{" "}
          <span className="font-medium text-[var(--text-secondary)]">StarVSK</span>
          {" · "}
          open source — keys stay in your browser
        </p>
        <p className="font-mono">rblxuploads · no telemetry · no cloud deps</p>
      </div>
    </footer>
  );
}
