import { LandingDemoLibrary } from "@/components/landing/LandingDemoLibrary";

export function ShowTell() {
  return (
    <section id="show-tell" className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
          <div className="max-w-lg">
            <p className="label mb-3">Show, don&apos;t tell</p>
            <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
              The same library you&apos;ll use in the workspace.
            </h2>
            <p className="mt-3 text-[var(--text-secondary)]">
              Search, filter, create folders, rename and reparent collections, select assets, and
              drag them onto folders — identical behavior to the Asset Library panel.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
            <p className="label mb-2">Try it</p>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li>
                <span className="font-mono text-[var(--text-secondary)]">+ New folder</span> — create
                nested collections
              </li>
              <li>
                Drag a row onto a folder — move assets without opening menus
              </li>
              <li>
                Select a folder — rename, reparent, or delete from the inspector
              </li>
              <li>
                <span className="font-mono text-[var(--text-secondary)]">ui</span> or{" "}
                <span className="font-mono text-[var(--text-secondary)]">9123847</span> — live search
              </li>
            </ul>
          </div>
        </div>

        <LandingDemoLibrary />
      </div>
    </section>
  );
}
