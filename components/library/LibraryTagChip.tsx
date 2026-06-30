"use client";

import { IconX } from "@/components/ui/Icon";
import { getTagChipStyle } from "@/lib/library-tags";
import { cn } from "@/lib/utils";

interface LibraryTagChipProps {
  tag: string;
  active?: boolean;
  removable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}

export function LibraryTagChip({
  tag,
  active = false,
  removable = false,
  onClick,
  onRemove,
  removeLabel = `Remove tag ${tag}`,
  className,
}: LibraryTagChipProps) {
  return (
    <span
      className={cn(
        "library-tag-chip",
        active && "library-tag-chip-active",
        onClick && "library-tag-chip-interactive",
        className,
      )}
      style={active ? undefined : getTagChipStyle(tag)}
    >
      {onClick ? (
        <button type="button" className="library-tag-chip-label" onClick={onClick}>
          <span className="truncate">{tag}</span>
        </button>
      ) : (
        <span className="library-tag-chip-label truncate">{tag}</span>
      )}
      {removable && onRemove ? (
        <button
          type="button"
          className="library-tag-chip-remove"
          onClick={onRemove}
          aria-label={removeLabel}
        >
          <IconX size={10} />
        </button>
      ) : null}
    </span>
  );
}
