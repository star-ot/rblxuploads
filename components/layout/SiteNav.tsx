"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { IconArrowRight, IconMenu, IconX } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type SiteNavVariant = "landing" | "default";

interface NavLinkItem {
  label: string;
  href: string;
  external?: boolean;
}

const LANDING_LINKS: NavLinkItem[] = [
  { label: "Credentials", href: "/#credentials" },
  { label: "Library", href: "/#show-tell" },
  { label: "Features", href: "/#features" },
  { label: "Teams", href: "/teams" },
  { label: "FAQ", href: "/#faq" },
  { label: "Changelog", href: "/changelog" },
];

const DEFAULT_LINKS: NavLinkItem[] = [
  { label: "Home", href: "/" },
  { label: "Library", href: "/#show-tell" },
  { label: "Teams", href: "/teams" },
  { label: "Changelog", href: "/changelog" },
  { label: "FAQ", href: "/#faq" },
];

interface SiteNavProps {
  variant?: SiteNavVariant;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href.startsWith("#") || href.includes("#")) return false;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function NavLink({
  item,
  pathname,
  className,
  onNavigate,
}: {
  item: NavLinkItem;
  pathname: string;
  className?: string;
  onNavigate?: () => void;
}) {
  const active = isActivePath(pathname, item.href);
  const sharedClass = cn(
    "site-nav-link",
    active && "site-nav-link-active",
    className,
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        className={sharedClass}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
      >
        {item.label}
      </a>
    );
  }

  if (item.href.startsWith("#")) {
    return (
      <a href={item.href} className={sharedClass} onClick={onNavigate}>
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={sharedClass} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

export function SiteNav({ variant = "default" }: SiteNavProps) {
  const pathname = usePathname();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const links = variant === "landing" ? LANDING_LINKS : DEFAULT_LINKS;
  const desktopNavClass = variant === "landing" ? "lg:flex" : "md:flex";
  const mobileNavClass = variant === "landing" ? "lg:hidden" : "md:hidden";
  const headerCtaClass = variant === "landing" ? "lg:inline-flex" : "sm:inline-flex";

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeMenu]);

  useEffect(() => {
    const media = window.matchMedia(
      `(min-width: ${variant === "landing" ? 1024 : 768}px)`,
    );

    const onChange = () => {
      if (media.matches) closeMenu();
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [closeMenu, variant]);

  const mobileMenu = (
    <div
      id={menuId}
      className={cn("site-nav-mobile", mobileNavClass, open && "site-nav-mobile-open")}
      aria-hidden={!open}
      inert={open ? undefined : true}
    >
      <button
        type="button"
        className="site-nav-backdrop"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={closeMenu}
      />

      <div className="site-nav-panel">
        <nav className="site-nav-mobile-links" aria-label="Mobile primary">
          {links.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              pathname={pathname}
              className="site-nav-mobile-link"
              onNavigate={closeMenu}
            />
          ))}
        </nav>

        <div className="site-nav-mobile-actions">
          <Link
            href="/workspace"
            className="btn-secondary w-full text-[13px]"
            onClick={closeMenu}
          >
            Open workspace
          </Link>
          <Link
            href="/workspace"
            className="btn-primary w-full text-[13px]"
            onClick={closeMenu}
          >
            Get started
            <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="site-nav sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <SiteLogo className="min-w-0 shrink" compact />

          <nav
            className={cn("site-nav-desktop hidden items-center gap-0.5", desktopNavClass)}
            aria-label="Primary"
          >
            {links.map((item) => (
              <NavLink key={item.label} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/workspace"
              className={cn("btn-secondary hidden text-[13px]", headerCtaClass)}
            >
              Open workspace
            </Link>
            <Link
              href="/workspace"
              className={cn("btn-primary hidden text-[13px]", headerCtaClass)}
            >
              Get started
              <IconArrowRight size={14} />
            </Link>

            <button
              type="button"
              className={cn("site-nav-toggle inline-flex", mobileNavClass)}
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <IconX size={18} /> : <IconMenu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {mounted ? createPortal(mobileMenu, document.body) : null}
    </>
  );
}
