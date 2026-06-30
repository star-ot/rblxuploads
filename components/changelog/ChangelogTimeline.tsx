import Link from "next/link";
import {
  CHANGE_TYPE_LABELS,
  CHANGE_TYPE_ORDER,
  formatReleaseDate,
  getChangelogReleases,
  groupChangesByType,
  LATEST_RELEASE,
  versionAnchor,
  type ChangeType,
} from "@/lib/changelog";
import { cn } from "@/lib/utils";
import { ChangelogVersionNav } from "./ChangelogVersionNav";

const CHANGE_TYPE_STYLES: Record<
  ChangeType,
  { badge: string; dot: string }
> = {
  added: {
    badge: "bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]",
    dot: "bg-[var(--success-text)]",
  },
  improved: {
    badge: "bg-[var(--accent-muted)] text-[var(--accent-hover)] border-[rgba(59,130,246,0.2)]",
    dot: "bg-[var(--accent)]",
  },
  changed: {
    badge: "bg-[var(--accent-subtle)] text-[var(--accent-hover)] border-[rgba(59,130,246,0.15)]",
    dot: "bg-[var(--accent-hover)]",
  },
  fixed: {
    badge: "bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]",
    dot: "bg-[var(--warning-text)]",
  },
  security: {
    badge: "bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]",
    dot: "bg-[var(--danger-text)]",
  },
  deprecated: {
    badge: "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]",
    dot: "bg-[var(--text-muted)]",
  },
};

export function ChangelogTimeline() {
  const releases = getChangelogReleases();

  return (
    <div className="changelog-layout mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="changelog-grid">
        <aside className="changelog-sidebar" aria-label="Release versions">
          <ChangelogVersionNav releases={releases} />
        </aside>

        <div className="changelog-timeline">
          {releases.map((release, index) => {
            const anchor = versionAnchor(release.version);
            const isLatest = release.version === LATEST_RELEASE.version;
            const grouped = groupChangesByType(release.changes);

            return (
              <article
                key={release.version}
                id={anchor}
                className={cn(
                  "changelog-release scroll-mt-24",
                  isLatest && "changelog-release-latest",
                )}
              >
                <header className="changelog-release-header">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-medium tracking-tight text-[var(--text-primary)] sm:text-2xl">
                      v{release.version}
                    </h2>
                    {isLatest ? (
                      <span className="changelog-latest-badge">Latest</span>
                    ) : null}
                  </div>

                  <time
                    dateTime={release.date}
                    className="font-mono text-xs text-[var(--text-faint)]"
                  >
                    {formatReleaseDate(release.date)}
                  </time>

                  {release.title ? (
                    <p className="font-display text-base font-medium text-[var(--text-secondary)]">
                      {release.title}
                    </p>
                  ) : null}

                  {release.summary ? (
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      {release.summary}
                    </p>
                  ) : null}
                </header>

                <div className="changelog-change-groups">
                  {CHANGE_TYPE_ORDER.map((type) => {
                    const items = grouped.get(type);
                    if (!items?.length) return null;

                    const styles = CHANGE_TYPE_STYLES[type];

                    return (
                      <section key={type} aria-label={CHANGE_TYPE_LABELS[type]}>
                        <h3 className="mb-2 flex items-center gap-2">
                          <span
                            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)}
                            aria-hidden
                          />
                          <span
                            className={cn(
                              "inline-flex rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
                              styles.badge,
                            )}
                          >
                            {CHANGE_TYPE_LABELS[type]}
                          </span>
                        </h3>
                        <ul className="changelog-change-list">
                          {items.map((change) => (
                            <li key={change.text} className="changelog-change-item">
                              <span className="text-sm leading-relaxed text-[var(--text-secondary)]">
                                {change.text}
                              </span>
                              {change.link ? (
                                <Link
                                  href={change.link.href}
                                  className="link-accent ml-1 text-sm"
                                >
                                  {change.link.label}
                                </Link>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>

                {index < releases.length - 1 ? (
                  <div className="changelog-connector" aria-hidden />
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
