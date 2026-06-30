import type { CSSProperties } from "react";

export function parseTagInput(input: string): string[] {
  return input
    .split(",")
    .map((tag) => normalizeTag(tag))
    .filter(Boolean);
}

export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ");
}

export function collectUniqueTags(
  assets: { tags: string[] }[],
  options?: { sort?: "alpha" | "count" },
): string[] {
  const counts = new Map<string, number>();

  for (const asset of assets) {
    for (const raw of asset.tags) {
      const tag = normalizeTag(raw);
      if (!tag) {
        continue;
      }
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const tags = Array.from(counts.keys());

  if (options?.sort === "count") {
    return tags.sort((a, b) => {
      const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
      return diff !== 0 ? diff : a.localeCompare(b);
    });
  }

  return tags.sort((a, b) => a.localeCompare(b));
}

export function mergeTags(existing: string[], incoming: string[]): string[] {
  const next = new Set(existing.map(normalizeTag).filter(Boolean));
  for (const tag of incoming) {
    const normalized = normalizeTag(tag);
    if (normalized) {
      next.add(normalized);
    }
  }
  return Array.from(next);
}

export function removeTag(existing: string[], tagToRemove: string): string[] {
  const target = normalizeTag(tagToRemove).toLowerCase();
  return existing.filter((tag) => normalizeTag(tag).toLowerCase() !== target);
}

const TAG_COLOR_HUES = [8, 24, 42, 68, 98, 128, 158, 188, 218, 248, 278, 308, 338] as const;

function hashTag(tag: string): number {
  const normalized = normalizeTag(tag).toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export interface TagChipColors {
  background: string;
  border: string;
  text: string;
}

export function getTagChipColors(tag: string): TagChipColors {
  const hue = TAG_COLOR_HUES[hashTag(tag) % TAG_COLOR_HUES.length];

  return {
    background: `hsl(${hue} 38% 20% / 0.92)`,
    border: `hsl(${hue} 42% 36% / 0.95)`,
    text: `hsl(${hue} 48% 88%)`,
  };
}

export function getTagChipStyle(tag: string): CSSProperties {
  const colors = getTagChipColors(tag);

  return {
    "--tag-chip-bg": colors.background,
    "--tag-chip-border": colors.border,
    "--tag-chip-text": colors.text,
  } as CSSProperties;
}
