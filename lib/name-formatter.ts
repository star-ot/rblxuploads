const MAX_NAME_LENGTH = 60;

export function formatRobloxAssetName(input: string): string {
  const rawBase = input.replace(/\.[^.]+$/, "");

  const cleaned = rawBase
    .replace(/[_\-]+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Untitled Image";
  }

  const titleCased = cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return capAssetName(titleCased);
}

export function capAssetName(name: string): string {
  const trimmed = name.trim();

  if (trimmed.length <= MAX_NAME_LENGTH) {
    return trimmed;
  }

  return trimmed.slice(0, MAX_NAME_LENGTH).trimEnd();
}
