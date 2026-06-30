"use client";

import { useEffect, useState } from "react";
import {
  formatReleaseDate,
  versionAnchor,
  type ChangelogRelease,
} from "@/lib/changelog";
import { cn } from "@/lib/utils";

interface ChangelogVersionNavProps {
  releases: readonly ChangelogRelease[];
}

export function ChangelogVersionNav({ releases }: ChangelogVersionNavProps) {
  const [activeVersion, setActiveVersion] = useState(releases[0]?.version ?? "");

  useEffect(() => {
    const anchors = releases.map((release) => versionAnchor(release.version));
    const elements = anchors
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const top = visible[0]?.target.id;
        if (top) {
          const version = top.replace(/^v/, "").replace(/-/g, ".");
          setActiveVersion(version);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [releases]);

  return (
    <nav className="changelog-version-nav">
      <p className="label mb-3 hidden lg:block">Versions</p>
      <ul className="changelog-version-list">
        {releases.map((release) => {
          const anchor = versionAnchor(release.version);
          const isActive = activeVersion === release.version;

          return (
            <li key={release.version}>
              <a
                href={`#${anchor}`}
                className={cn(
                  "changelog-version-link",
                  isActive && "changelog-version-link-active",
                )}
                aria-current={isActive ? "location" : undefined}
              >
                <span className="font-mono text-[13px]">v{release.version}</span>
                <span className="changelog-version-date">
                  {formatReleaseDate(release.date)}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
