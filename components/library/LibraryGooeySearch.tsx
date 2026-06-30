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
};

export function LibraryGooeySearch({
  classNames,
  placeholder = "Search name, ID, folder, tags…",
  collapsedWidth = 220,
  expandedWidth = 360,
  expandedOffset = 50,
  gooeyBlur = 4,
  ...props
}: LibraryGooeySearchProps) {
  return (
    <GooeyInput
      placeholder={placeholder}
      collapsedWidth={collapsedWidth}
      expandedWidth={expandedWidth}
      expandedOffset={expandedOffset}
      gooeyBlur={gooeyBlur}
      classNames={{
        ...workspaceClassNames,
        ...classNames,
      }}
      {...props}
    />
  );
}
