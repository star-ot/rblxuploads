"use client";

import type { ReactNode } from "react";
import { LibraryGooeySearch } from "@/components/library/LibraryGooeySearch";
import type { AssetType } from "@/lib/types";

interface LibraryFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: AssetType | "all";
  onTypeFilterChange: (value: AssetType | "all") => void;
  onReset: () => void;
  selectedCount?: number;
  selectionActions?: ReactNode;
}

export function LibraryFilterBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onReset,
  selectedCount = 0,
  selectionActions,
}: LibraryFilterBarProps) {
  return (
    <div className="library-filter-bar">
      <LibraryGooeySearch value={search} onValueChange={onSearchChange} compact />
      <select
        className="library-compact-input library-filter-type"
        value={typeFilter}
        onChange={(event) => onTypeFilterChange(event.target.value as AssetType | "all")}
        aria-label="Filter by type"
      >
        <option value="all">All types</option>
        <option value="Image">Image</option>
        <option value="Audio">Audio</option>
        <option value="Model">Model</option>
        <option value="Mesh">Mesh</option>
      </select>
      <button type="button" className="library-compact-btn btn-ghost" onClick={onReset}>
        Reset
      </button>
      {selectedCount > 0 && selectionActions ? (
        <div
          className="library-filter-selection-group"
          aria-label={`${selectedCount} assets selected`}
        >
          <span className="library-filter-selection-divider" aria-hidden />
          <span className="library-filter-selection-count">{selectedCount} selected</span>
          {selectionActions}
        </div>
      ) : null}
    </div>
  );
}
