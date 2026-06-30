"use client";

import { useState, type ReactNode } from "react";
import { IconFolder } from "@/components/ui/Icon";
import { LibraryTableSkeleton } from "@/components/library/LibraryTableSkeleton";

interface LibraryCollectionsLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  loading?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function LibraryCollectionsLayout({
  sidebar,
  children,
  loading = false,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
}: LibraryCollectionsLayoutProps) {
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? uncontrolledCollapsed;

  function setCollapsed(next: boolean) {
    if (collapsedProp === undefined) {
      setUncontrolledCollapsed(next);
    }
    onCollapsedChange?.(next);
  }

  if (loading) {
    return (
      <div className="library-collections-layout mt-2">
        <div className="skeleton min-h-[12rem] rounded-lg" aria-hidden />
        <LibraryTableSkeleton />
      </div>
    );
  }

  return (
    <div
      className={[
        "library-collections-layout mt-2",
        collapsed ? "library-collections-layout-collapsed" : "",
      ].join(" ")}
    >
      {!collapsed ? sidebar : null}
      <div className="library-collections-main min-w-0">
        {collapsed ? (
          <button
            type="button"
            className="library-collections-reopen"
            onClick={() => setCollapsed(false)}
          >
            <IconFolder size={14} aria-hidden />
            Collections
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
