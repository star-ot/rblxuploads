export function HeroComposition() {
  return (
    <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
      <div className="hero-grid-bg absolute inset-0 -z-10" aria-hidden />

      <div className="relative grid grid-cols-12 gap-3 p-4 sm:gap-4 sm:p-6">
        {/* Search bar fragment */}
        <div className="hero-fragment col-span-12 sm:col-span-7">
          <div className="surface rounded-xl p-3 shadow-[var(--shadow-md)]">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="font-mono text-[10px] text-[var(--text-faint)]">Library</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-inset)] px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--text-faint)]">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="font-mono text-xs text-[var(--text-muted)]">ui_icons...</span>
            </div>
          </div>
        </div>

        {/* Asset grid fragment */}
        <div className="hero-fragment col-span-6 sm:col-span-5">
          <div className="surface rounded-xl p-3 shadow-[var(--shadow-md)]">
            <p className="mb-2 font-mono text-[10px] text-[var(--text-faint)]">Collections</p>
            <div className="grid grid-cols-3 gap-1.5">
              {["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"].map(
                (color, i) => (
                  <div
                    key={color}
                    className="aspect-square rounded-md"
                    style={{
                      background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)`,
                      border: "1px solid var(--border-subtle)",
                    }}
                    aria-hidden
                  >
                    {i === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-3 w-3 rounded-sm bg-[var(--accent)] opacity-60" />
                      </div>
                    ) : null}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Upload queue fragment */}
        <div className="hero-fragment col-span-6 sm:col-span-5 sm:col-start-8">
          <div className="surface rounded-xl p-3 shadow-[var(--shadow-md)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[var(--text-faint)]">Queue</span>
              <span className="status-chip status-uploading text-[9px]">Sending</span>
            </div>
            <div className="space-y-2">
              {[
                { name: "icon_home.png", pct: 72 },
                { name: "sfx_click.ogg", pct: 34 },
                { name: "char_mesh.fbx", pct: 100 },
              ].map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[10px] text-[var(--text-muted)]">
                      {item.name}
                    </span>
                    <span className="font-mono text-[9px] text-[var(--text-faint)]">
                      {item.pct}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Metadata fragment */}
        <div className="hero-fragment col-span-12 sm:col-span-7">
          <div className="surface rounded-xl p-3 shadow-[var(--shadow-md)]">
            <p className="mb-2 font-mono text-[10px] text-[var(--text-faint)]">Asset detail</p>
            <div className="flex gap-3">
              <div className="h-12 w-12 shrink-0 rounded-md border border-[var(--border)] bg-gradient-to-br from-[var(--accent-muted)] to-transparent" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                  UI_IconInventory
                </p>
                <p className="font-mono text-[10px] text-[var(--success-text)]">
                  rbxassetid://18472930102
                </p>
                <div className="flex flex-wrap gap-1">
                  {["ui", "icons", "inventory"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded px-1.5 py-0.5 font-mono text-[9px] text-[var(--text-muted)]"
                      style={{ background: "var(--surface-hover)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Folder tree fragment */}
        <div className="hero-fragment col-span-12 sm:col-span-5 sm:col-start-8">
          <div className="surface rounded-xl p-3 shadow-[var(--shadow-md)]">
            <p className="mb-2 font-mono text-[10px] text-[var(--text-faint)]">Explorer</p>
            <div className="space-y-0.5 font-mono text-[10px]">
              {[
                { path: "Assets", depth: 0, count: 142 },
                { path: "UI", depth: 1, count: 48 },
                { path: "Icons", depth: 2, count: 31 },
                { path: "Audio", depth: 1, count: 67 },
              ].map((folder) => (
                <div
                  key={folder.path}
                  className="flex items-center justify-between rounded px-1.5 py-1 text-[var(--text-muted)]"
                  style={{
                    paddingLeft: `${folder.depth * 0.75 + 0.375}rem`,
                    background: folder.depth === 2 ? "var(--accent-subtle)" : undefined,
                    color: folder.depth === 2 ? "var(--text-primary)" : undefined,
                  }}
                >
                  <span>{folder.path}</span>
                  <span className="text-[var(--text-faint)]">{folder.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
