"use client";

import { useMemo, useState } from "react";
import { LibraryGooeySearch } from "@/components/library/LibraryGooeySearch";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconFolder, IconSearch } from "@/components/ui/Icon";
import {
  DEMO_LIBRARY_ASSETS,
  filterDemoLibraryAssets,
  getAssetTypeGlyph,
} from "@/lib/demo-library-assets";
import type { AssetType } from "@/lib/types";

const DEMO_FOLDERS = [
  { path: "Assets", count: 6 },
  { path: "Assets/UI", count: 2 },
  { path: "Assets/UI/Icons", count: 2 },
  { path: "Assets/Audio", count: 2 },
  { path: "Assets/Characters", count: 1 },
  { path: "Assets/World", count: 1 },
] as const;

function AssetPreviewThumb({ asset }: { asset: (typeof DEMO_LIBRARY_ASSETS)[number] }) {
  if (asset.thumbnailDataUrl) {
    return (
      <img
        src={asset.thumbnailDataUrl}
        alt=""
        className="h-8 w-8 rounded border border-[var(--border-subtle)] object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--surface-inset)] text-[10px] font-medium text-[var(--text-muted)]">
      {getAssetTypeGlyph(asset.type)}
    </div>
  );
}

const TYPE_FILTERS: Array<{ id: AssetType | "all"; label: string }> = [
  { id: "all", label: "All types" },
  { id: "Image", label: "Image" },
  { id: "Audio", label: "Audio" },
  { id: "Model", label: "Model" },
  { id: "Mesh", label: "Mesh" },
];

export function ShowTell() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const [folderFilter, setFolderFilter] = useState<string | "all">("all");
  const [searchOpen, setSearchOpen] = useState(false);

  const filteredAssets = useMemo(
    () =>
      filterDemoLibraryAssets(DEMO_LIBRARY_ASSETS, {
        search,
        typeFilter,
        folderFilter,
      }),
    [folderFilter, search, typeFilter],
  );

  const activeFolder =
    folderFilter === "all" ? "All assets" : folderFilter.split("/").pop() ?? folderFilter;

  return (
    <section id="show-tell" className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
          <div className="max-w-lg">
            <p className="label mb-3">Show, don&apos;t tell</p>
            <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
              The same library search you&apos;ll use in the workspace.
            </h2>
            <p className="mt-3 text-[var(--text-secondary)]">
              Click the search control, type a name, tag, folder, or asset ID. Results filter
              live — identical haystack matching to the Asset Library panel.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
            <p className="label mb-2">Try it</p>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li>
                <span className="font-mono text-[var(--text-secondary)]">ui</span> — matches icons,
                folders, and tags
              </li>
              <li>
                <span className="font-mono text-[var(--text-secondary)]">9123847</span> — partial
                asset ID search
              </li>
              <li>
                <span className="font-mono text-[var(--text-secondary)]">Nature</span> — folder path
                filter via search
              </li>
            </ul>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h3 className="font-display text-lg font-medium tracking-tight text-[var(--text-primary)]">
                Asset library
              </h3>
              <p className="caption max-w-prose">
                Live preview with sample data. Open the workspace to search your real IndexedDB
                library.
              </p>
              <p className="pt-1 font-mono text-xs text-[var(--text-faint)]">
                {DEMO_LIBRARY_ASSETS.length} assets · {DEMO_FOLDERS.length} folders ·{" "}
                {searchOpen ? "search expanded" : "search collapsed"}
              </p>
            </div>
          </div>

          <div className="grid gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <LibraryGooeySearch
                value={search}
                onValueChange={setSearch}
                onOpenChange={setSearchOpen}
                collapsedWidth={240}
                expandedWidth={420}
                expandedOffset={52}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:col-span-2 lg:col-span-2">
              {TYPE_FILTERS.map((filter) => {
                const active = typeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                      active
                        ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
                        : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                    onClick={() => setTypeFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
            <aside className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-2">
              <p className="label px-2 pb-2">Collections</p>
              <button
                type="button"
                className={`mb-1 flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors ${
                  folderFilter === "all"
                    ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
                onClick={() => setFolderFilter("all")}
              >
                <span className="flex items-center gap-2">
                  <IconFolder size={14} className="shrink-0 opacity-60" />
                  All assets
                </span>
                <span className="font-mono text-[11px] text-[var(--text-faint)]">
                  {DEMO_LIBRARY_ASSETS.length}
                </span>
              </button>
              <div className="space-y-0.5">
                {DEMO_FOLDERS.slice(1).map((folder) => {
                  const depth = folder.path.split("/").length - 1;
                  const active = folderFilter === folder.path;
                  return (
                    <button
                      key={folder.path}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-mono text-[11px] transition-colors ${
                        active
                          ? "bg-[var(--accent-subtle)] text-[var(--text-primary)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]"
                      }`}
                      style={{ paddingLeft: `${depth * 0.65 + 0.5}rem` }}
                      onClick={() => setFolderFilter(folder.path)}
                    >
                      <span className="truncate">{folder.path.split("/").pop()}</span>
                      <span className="text-[var(--text-faint)]">{folder.count}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
              {filteredAssets.length === 0 ? (
                <EmptyState
                  icon={<IconSearch size={18} />}
                  title="No assets found"
                  description="Try adjusting your search or filters — same empty state as the workspace."
                />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-12" />
                      <th>Name</th>
                      <th>Type</th>
                      <th>Asset ID</th>
                      <th className="hidden md:table-cell">Collection</th>
                      <th className="hidden lg:table-cell">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id}>
                        <td>
                          <AssetPreviewThumb asset={asset} />
                        </td>
                        <td className="font-medium text-[var(--text-primary)]">{asset.name}</td>
                        <td className="text-[var(--text-muted)]">{asset.type}</td>
                        <td className="font-mono text-[11px] text-[var(--success-text)]">
                          {asset.assetId}
                        </td>
                        <td className="hidden font-mono text-[11px] text-[var(--text-muted)] md:table-cell">
                          {asset.folderPath}
                        </td>
                        <td className="hidden text-[var(--text-muted)] lg:table-cell">
                          <span className="flex flex-wrap gap-1">
                            {asset.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                                style={{ background: "var(--surface-hover)" }}
                              >
                                {tag}
                              </span>
                            ))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <p className="mt-4 text-center font-mono text-[11px] text-[var(--text-faint)]">
            Showing {filteredAssets.length} of {DEMO_LIBRARY_ASSETS.length} in{" "}
            <span className="text-[var(--text-muted)]">{activeFolder}</span>
            {search.trim() ? (
              <>
                {" "}
                matching <span className="text-[var(--text-muted)]">&quot;{search.trim()}&quot;</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  );
}
