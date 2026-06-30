"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { LibraryTagChip } from "@/components/library/LibraryTagChip";
import { normalizeTag } from "@/lib/library-tags";
import { IconPlus } from "@/components/ui/Icon";

interface LibraryAssetTagsProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onTagClick?: (tag: string) => void;
  disabled?: boolean;
}

export function LibraryAssetTags({
  tags,
  onAddTag,
  onRemoveTag,
  onTagClick,
  disabled = false,
}: LibraryAssetTagsProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const next = normalizeTag(draft);
    if (!next) {
      setIsAdding(false);
      setDraft("");
      return;
    }

    onAddTag(next);
    setDraft("");
    setIsAdding(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft("");
      setIsAdding(false);
    }
  }

  return (
    <div className="library-asset-tags">
      {tags.length > 0 ? (
        <div className="library-asset-tags-list">
          {tags.map((tag) => (
            <LibraryTagChip
              key={tag}
              tag={tag}
              removable={!disabled}
              onClick={onTagClick ? () => onTagClick(tag) : undefined}
              onRemove={disabled ? undefined : () => onRemoveTag(tag)}
              removeLabel={`Remove ${tag} from asset`}
            />
          ))}
        </div>
      ) : (
        <span className="library-asset-tags-empty" aria-hidden>
          —
        </span>
      )}

      {!disabled ? (
        <div className="library-asset-tags-add">
          {isAdding ? (
            <input
              ref={inputRef}
              id={inputId}
              className="library-asset-tags-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commitDraft}
              placeholder="Tag name"
              aria-label="New tag name"
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="library-asset-tags-add-btn"
              onClick={() => {
                setIsAdding(true);
                queueMicrotask(() => inputRef.current?.focus());
              }}
              aria-label="Add tag"
            >
              <IconPlus size={10} />
              Add
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
