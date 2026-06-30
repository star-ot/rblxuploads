import { CHANGELOG_RELEASES } from "./entries";
import type { ChangeType, ChangelogRelease } from "./types";

export type { ChangeType, ChangelogChange, ChangelogRelease } from "./types";
export { CHANGELOG_RELEASES };

export const LATEST_RELEASE = CHANGELOG_RELEASES[0];

export function getChangelogReleases(): readonly ChangelogRelease[] {
  return CHANGELOG_RELEASES;
}

export function getReleaseByVersion(version: string): ChangelogRelease | undefined {
  return CHANGELOG_RELEASES.find((release) => release.version === version);
}

export function versionAnchor(version: string): string {
  return `v${version.replace(/\./g, "-")}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function formatReleaseDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T12:00:00Z`));
}

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  improved: "Improved",
  security: "Security",
  deprecated: "Deprecated",
};

export const CHANGE_TYPE_ORDER: readonly ChangeType[] = [
  "added",
  "improved",
  "changed",
  "fixed",
  "security",
  "deprecated",
];

export function groupChangesByType(
  changes: ChangelogRelease["changes"],
): Map<ChangeType, ChangelogRelease["changes"]> {
  const grouped = new Map<ChangeType, ChangelogRelease["changes"]>();

  for (const change of changes) {
    const existing = grouped.get(change.type) ?? [];
    grouped.set(change.type, [...existing, change]);
  }

  return grouped;
}
