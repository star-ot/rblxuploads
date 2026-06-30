"use client";

import { useId } from "react";
import { IconTag, IconX } from "@/components/ui/Icon";
import { LibraryTagChip } from "@/components/library/LibraryTagChip";

interface LibraryTagFilterProps {
  allTags: string[];
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
}

export function LibraryTagFilter({
  allTags,
  tagFilter,
  onTagFilterChange,
}: LibraryTagFilterProps) {
  const inputId = useId();
  const activeTag = tagFilter.trim();
  const hasActiveTag = Boolean(activeTag);

  return (
    <div className="library-tag-filter">
      <div className="library-tag-filter-row">
        <label htmlFor={inputId} className="library-tag-filter-label library-tag-filter-label-inline">
          Tags
        </label>
        <div className="library-tag-filter-input-wrap">
          <IconTag size={12} className="shrink-0 text-[var(--text-faint)]" aria-hidden />
          <input
            id={inputId}
            className="library-tag-filter-input"
            placeholder="Filter…"
            value={tagFilter}
            onChange={(event) => onTagFilterChange(event.target.value)}
            aria-label="Filter by tag"
          />
          {hasActiveTag ? (
            <button
              type="button"
              className="library-tag-filter-clear"
              onClick={() => onTagFilterChange("")}
              aria-label="Clear tag filter"
            >
              <IconX size={10} />
            </button>
          ) : null}
        </div>

        <div className="library-tag-filter-cloud" aria-label="Tags in library">
          {allTags.length > 0 ? (
            allTags.map((tag) => (
              <LibraryTagChip
                key={tag}
                tag={tag}
                active={activeTag.toLowerCase() === tag.toLowerCase()}
                onClick={() =>
                  onTagFilterChange(
                    activeTag.toLowerCase() === tag.toLowerCase() ? "" : tag,
                  )
                }
              />
            ))
          ) : (
            <span className="library-tag-filter-empty">No tags</span>
          )}
        </div>
      </div>
    </div>
  );
}
