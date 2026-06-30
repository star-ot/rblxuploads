"use client";

import {
  LIBRARY_SORT_COLUMN_LABELS,
  type LibrarySortColumn,
  type LibrarySortState,
} from "@/lib/library-sort";
import { cn } from "@/lib/utils";

interface LibrarySortableHeaderProps {
  column: LibrarySortColumn;
  sort: LibrarySortState;
  onSort: (column: LibrarySortColumn) => void;
  className?: string;
  align?: "left" | "right";
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: LibrarySortState["direction"];
}) {
  return (
    <span
      className={cn(
        "library-sort-indicator",
        active && "library-sort-indicator-active",
        active && direction === "asc" && "library-sort-indicator-asc",
        active && direction === "desc" && "library-sort-indicator-desc",
      )}
      aria-hidden
    >
      <span className="library-sort-caret library-sort-caret-up" />
      <span className="library-sort-caret library-sort-caret-down" />
    </span>
  );
}

export function LibrarySortableHeader({
  column,
  sort,
  onSort,
  className,
  align = "left",
}: LibrarySortableHeaderProps) {
  const active = sort.column === column;
  const label = LIBRARY_SORT_COLUMN_LABELS[column];

  return (
    <th className={className} aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className={cn(
          "library-sort-button",
          align === "right" && "library-sort-button-right",
          active && "library-sort-button-active",
        )}
        onClick={() => onSort(column)}
        aria-label={
          active
            ? `Sort by ${label}, currently ${sort.direction === "asc" ? "ascending" : "descending"}`
            : `Sort by ${label}`
        }
      >
        <span>{label}</span>
        <SortIndicator active={active} direction={sort.direction} />
      </button>
    </th>
  );
}
