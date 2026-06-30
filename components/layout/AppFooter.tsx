export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-xs leading-relaxed text-[var(--text-faint)]">
          Not affiliated with Roblox Corporation. Independent tool by StarVSK.
        </p>
        <p className="font-mono text-xs text-[var(--text-faint)]">
          Credentials in browser only · No telemetry
        </p>
      </div>
    </footer>
  );
}
