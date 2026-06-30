import type { AssetType } from "@/lib/types";

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const TYPE_ACCENTS: Record<AssetType, { from: string; to: string; glyph: string }> = {
  Image: { from: "#3b82f6", to: "#1d4ed8", glyph: "◆" },
  Audio: { from: "#8b5cf6", to: "#6d28d9", glyph: "♪" },
  Model: { from: "#10b981", to: "#047857", glyph: "▣" },
  Mesh: { from: "#f59e0b", to: "#b45309", glyph: "◇" },
};

export function createDemoThumbnail(type: AssetType, seed = 0): string {
  const accent = TYPE_ACCENTS[type];
  const offset = seed * 17;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent.from}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${accent.to}" stop-opacity="0.15"/>
      </linearGradient>
      <pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="translate(${offset % 8} ${offset % 5})">
        <rect width="8" height="8" fill="transparent"/>
        <circle cx="1" cy="1" r="0.75" fill="${accent.from}" fill-opacity="0.18"/>
      </pattern>
    </defs>
    <rect width="64" height="64" rx="8" fill="url(#g)"/>
    <rect width="64" height="64" rx="8" fill="url(#p)"/>
    <text x="32" y="38" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" fill="${accent.from}" fill-opacity="0.75">${accent.glyph}</text>
  </svg>`;
  return svgDataUrl(svg);
}

export function createDemoImageThumbnail(label: string, hue: number): string {
  const from = `hsl(${hue} 70% 55%)`;
  const to = `hsl(${hue} 60% 35%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${from}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${to}" stop-opacity="0.25"/>
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="8" fill="url(#g)"/>
    <rect x="14" y="18" width="36" height="28" rx="4" fill="${from}" fill-opacity="0.35" stroke="${to}" stroke-opacity="0.4" stroke-width="1"/>
    <circle cx="24" cy="28" r="4" fill="${to}" fill-opacity="0.5"/>
    <path d="M16 40 L28 32 L38 38 L48 28" stroke="${to}" stroke-opacity="0.55" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="32" y="58" text-anchor="middle" font-family="ui-monospace,monospace" font-size="7" fill="${to}" fill-opacity="0.7">${label.slice(0, 10)}</text>
  </svg>`;
  return svgDataUrl(svg);
}
