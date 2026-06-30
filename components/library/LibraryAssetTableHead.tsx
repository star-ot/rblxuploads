"use client";

import { LibrarySortableHeader } from "@/components/library/LibrarySortableHeader";
import type { LibrarySortColumn, LibrarySortState } from "@/lib/library-sort";

interface LibraryAssetTableHeadProps {
  sort: LibrarySortState;
  onSort: (column: LibrarySortColumn) => void;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  showVersions?: boolean;
}

export function LibraryAssetTableHead({
  sort,
  onSort,
  allSelected,
  onSelectAll,
  showVersions = true,
}: LibraryAssetTableHeadProps) {
  return (
    <thead>
      <tr>
        <th className="w-10">
          <input
            type="checkbox"
            aria-label="Select all visible assets"
            checked={allSelected}
            onChange={(event) => onSelectAll(event.target.checked)}
          />
        </th>
        <th className="library-asset-thumb-head hidden sm:table-cell" aria-hidden />
        <LibrarySortableHeader column="name" sort={sort} onSort={onSort} />
        <LibrarySortableHeader column="type" sort={sort} onSort={onSort} />
        <LibrarySortableHeader column="assetId" sort={sort} onSort={onSort} />
        <LibrarySortableHeader
          column="folderPath"
          sort={sort}
          onSort={onSort}
          className="hidden md:table-cell"
        />
        <LibrarySortableHeader
          column="tags"
          sort={sort}
          onSort={onSort}
          className="hidden min-w-[10rem] sm:table-cell"
        />
        <LibrarySortableHeader
          column="createdAt"
          sort={sort}
          onSort={onSort}
          className="hidden whitespace-nowrap lg:table-cell"
          align="right"
        />
        {showVersions ? (
          <th className="library-version-cell min-w-[10.5rem] text-left text-[11px] font-medium uppercase tracking-wide text-[var(--text-faint)]">
            Versions
          </th>
        ) : null}
      </tr>
    </thead>
  );
}
