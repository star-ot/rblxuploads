"use client";

import { GooeyInput, type GooeyInputProps } from "@/components/ui/gooey-input";

const workspaceClassNames: NonNullable<GooeyInputProps["classNames"]> = {
  root: "justify-start",
  filterWrap: "w-full",
  buttonRow: "w-full",
  trigger:
    "bg-[var(--bg-elevated)] text-[var(--text-primary)] ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]",
  bubbleSurface:
    "bg-[var(--accent)] text-white ring-1 ring-[var(--accent-hover)]",
  input: "text-[var(--text-primary)] placeholder:text-[var(--text-faint)]",
};

type LibraryGooeySearchProps = Omit<GooeyInputProps, "classNames" | "placeholder"> & {
  classNames?: GooeyInputProps["classNames"];
  placeholder?: string;
  /** Reserve grid space while the gooey control expands in-place. Defaults to true. */
  stableLayout?: boolean;
  /** Shorter control for single-row filter bars. */
  compact?: boolean;
};

export function LibraryGooeySearch({
  classNames,
  placeholder = "Search name, ID, folder, tags…",
  collapsedWidth,
  expandedWidth,
  expandedOffset = 50,
  gooeyBlur = 4,
  stableLayout = true,
  compact = false,
  ...props
}: LibraryGooeySearchProps) {
  const resolvedCollapsedWidth = collapsedWidth ?? (compact ? 160 : 220);
  const resolvedExpandedWidth = expandedWidth ?? (compact ? 280 : 360);

  return (
    <div
      className={
        stableLayout
          ? compact
            ? "library-search-slot library-search-slot-compact"
            : "library-search-slot"
          : undefined
      }
    >
      <GooeyInput
        placeholder={placeholder}
        collapsedWidth={resolvedCollapsedWidth}
        expandedWidth={resolvedExpandedWidth}
        expandedOffset={stableLayout ? 0 : expandedOffset}
        gooeyBlur={gooeyBlur}
        containLayout={stableLayout}
        classNames={{
          ...workspaceClassNames,
          ...(stableLayout
            ? {
                root: "w-full justify-start",
                filterWrap: compact ? "h-8 w-full" : "w-full",
                buttonRow: "w-full",
                trigger: compact
                  ? `${workspaceClassNames.trigger ?? ""} h-8 min-h-8 w-full px-2.5 text-xs`
                  : `${workspaceClassNames.trigger ?? ""} w-full`,
                input: compact
                  ? "text-xs text-[var(--text-primary)] placeholder:text-[var(--text-faint)]"
                  : workspaceClassNames.input,
              }
            : {}),
          ...classNames,
        }}
        {...props}
      />
    </div>
  );
}
