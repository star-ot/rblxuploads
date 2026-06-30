interface LibraryStatusSlotProps {
  message: string;
}

export function LibraryStatusSlot({ message }: LibraryStatusSlotProps) {
  return (
    <div className="library-status-slot" aria-live="polite">
      {message ? (
        <p className="alert alert-info text-[13px]" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
