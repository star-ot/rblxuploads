"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { LibraryTagChip } from "@/components/library/LibraryTagChip";
import { mergeTags, normalizeTag, parseTagInput } from "@/lib/library-tags";

interface LibraryBulkTagEditorProps {
  selectedCount: number;
  suggestedTags: string[];
  onApplyTags: (tags: string[]) => void;
  onRemoveTagFromSelection: (tag: string) => void;
  disabled?: boolean;
}

export function LibraryBulkTagEditor({
  selectedCount,
  suggestedTags,
  onApplyTags,
  onRemoveTagFromSelection,
  disabled = false,
}: LibraryBulkTagEditorProps) {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const [removeDraft, setRemoveDraft] = useState("");

  const parsedDraftTags = useMemo(() => parseTagInput(draft), [draft]);
  const canApply = selectedCount > 0 && parsedDraftTags.length > 0 && !disabled;
  const selectionDisabled = disabled || selectedCount === 0;

  const unusedSuggestions = useMemo(() => {
    const draftSet = new Set(parsedDraftTags.map((tag) => tag.toLowerCase()));
    return suggestedTags.filter((tag) => !draftSet.has(tag.toLowerCase())).slice(0, 6);
  }, [parsedDraftTags, suggestedTags]);

  function handleApply(event: FormEvent) {
    event.preventDefault();
    if (!canApply) {
      return;
    }
    onApplyTags(parsedDraftTags);
    setDraft("");
  }

  function handleRemove(event: FormEvent) {
    event.preventDefault();
    const tag = normalizeTag(removeDraft);
    if (!tag || selectionDisabled) {
      return;
    }
    onRemoveTagFromSelection(tag);
    setRemoveDraft("");
  }

  return (
    <div className="library-bulk-tags">
      <div className="library-bulk-tags-toolbar">
        <span className="library-tag-filter-label library-tag-filter-label-inline">Bulk</span>
        <form className="library-bulk-tags-action" onSubmit={handleApply}>
          <label htmlFor={inputId} className="sr-only">
            Tags to add to selected assets
          </label>
          <input
            id={inputId}
            className="library-compact-input library-bulk-tags-input"
            placeholder="Add tags…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={selectionDisabled}
          />
          <button
            type="submit"
            className="library-compact-btn btn-secondary"
            disabled={!canApply}
            title={
              selectedCount > 0
                ? `Add tags to ${selectedCount} selected assets`
                : "Select assets first"
            }
          >
            Add{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </button>
        </form>

        <form className="library-bulk-tags-action" onSubmit={handleRemove}>
          <label htmlFor={`${inputId}-remove`} className="sr-only">
            Tag to remove from selected assets
          </label>
          <input
            id={`${inputId}-remove`}
            className="library-compact-input library-bulk-tags-input"
            placeholder="Remove tag…"
            value={removeDraft}
            onChange={(event) => setRemoveDraft(event.target.value)}
            disabled={selectionDisabled}
            list={`${inputId}-remove-list`}
          />
          <datalist id={`${inputId}-remove-list`}>
            {suggestedTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <button
            type="submit"
            className="library-compact-btn btn-secondary"
            disabled={selectionDisabled || !normalizeTag(removeDraft)}
            title={
              selectedCount > 0
                ? `Remove tag from ${selectedCount} selected assets`
                : "Select assets first"
            }
          >
            Remove
          </button>
        </form>
      </div>

      {unusedSuggestions.length > 0 && selectedCount > 0 ? (
        <div className="library-bulk-tags-suggestions" aria-label="Suggested tags">
          {unusedSuggestions.map((tag) => (
            <LibraryTagChip
              key={tag}
              tag={tag}
              onClick={() =>
                setDraft((current) => mergeTags(parseTagInput(current), [tag]).join(", "))
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
