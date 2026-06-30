interface LibraryFooterSummaryProps {
  visibleCount: number;
  totalCount: number;
  activeFolder: string;
  search?: string;
  selectedCount?: number;
}

export function LibraryFooterSummary({
  visibleCount,
  totalCount,
  activeFolder,
  search = "",
  selectedCount = 0,
}: LibraryFooterSummaryProps) {
  const trimmedSearch = search.trim();

  return (
    <p className="mt-3 text-center font-mono text-[11px] text-[var(--text-faint)]">
      Showing {visibleCount} of {totalCount} in{" "}
      <span className="text-[var(--text-muted)]">{activeFolder}</span>
      {trimmedSearch ? (
        <>
          {" "}
          matching <span className="text-[var(--text-muted)]">&quot;{trimmedSearch}&quot;</span>
        </>
      ) : null}
      {selectedCount > 0 ? (
        <>
          {" "}
          · <span className="text-[var(--text-muted)]">{selectedCount} selected</span>
        </>
      ) : null}
    </p>
  );
}
