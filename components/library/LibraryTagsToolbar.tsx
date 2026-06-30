import type { ReactNode } from "react";
import { LibraryBulkTagEditor } from "@/components/library/LibraryBulkTagEditor";
import { LibraryTagFilter } from "@/components/library/LibraryTagFilter";

interface LibraryTagsToolbarProps {
  allTags: string[];
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  selectedCount: number;
  onApplyTags: (tags: string[]) => void;
  onRemoveTagFromSelection: (tag: string) => void;
  actions?: ReactNode;
  bulkDisabled?: boolean;
}

export function LibraryTagsToolbar({
  allTags,
  tagFilter,
  onTagFilterChange,
  selectedCount,
  onApplyTags,
  onRemoveTagFromSelection,
  actions,
  bulkDisabled = false,
}: LibraryTagsToolbarProps) {
  return (
    <div className="library-tags-toolbar">
      <LibraryTagFilter
        allTags={allTags}
        tagFilter={tagFilter}
        onTagFilterChange={onTagFilterChange}
      />
      <div className="library-tags-toolbar-divider" aria-hidden />
      <LibraryBulkTagEditor
        selectedCount={selectedCount}
        suggestedTags={allTags}
        onApplyTags={onApplyTags}
        onRemoveTagFromSelection={onRemoveTagFromSelection}
        disabled={bulkDisabled}
      />
      {actions ? <div className="library-tags-toolbar-actions">{actions}</div> : null}
    </div>
  );
}
