import type { ReactNode } from "react";

interface LibraryActionsBarProps {
  children: ReactNode;
}

export function LibraryActionsBar({ children }: LibraryActionsBarProps) {
  return <div className="library-actions-bar">{children}</div>;
}
