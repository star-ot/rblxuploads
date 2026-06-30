export type ChangeType =
  | "added"
  | "changed"
  | "fixed"
  | "improved"
  | "security"
  | "deprecated";

export interface ChangelogChange {
  type: ChangeType;
  text: string;
  link?: {
    href: string;
    label: string;
  };
}

export interface ChangelogRelease {
  /** Semantic version, e.g. "0.3.0" */
  version: string;
  /** ISO date string, e.g. "2026-06-30" */
  date: string;
  /** Short headline shown under the version */
  title?: string;
  /** One-line summary for the release card */
  summary?: string;
  changes: ChangelogChange[];
}
