export function LibraryTableSkeleton() {
  return (
    <div className="library-table-skeleton" aria-busy="true" aria-label="Loading asset library">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="library-table-skeleton-row">
          <span className="library-skeleton-block library-skeleton-checkbox" />
          <span className="library-skeleton-block library-skeleton-thumb" />
          <span className="library-skeleton-block library-skeleton-name" />
          <span className="library-skeleton-block library-skeleton-type" />
          <span className="library-skeleton-block library-skeleton-id" />
        </div>
      ))}
    </div>
  );
}
