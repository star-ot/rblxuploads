import type { ChangelogRelease } from "./types";

/**
 * Changelog entries — newest first.
 *
 * To publish a release:
 * 1. Add a new object at the top of this array.
 * 2. Bump `version` in package.json to match.
 * 3. Group changes under the appropriate `type` (added, changed, fixed, etc.).
 */
export const CHANGELOG_RELEASES: readonly ChangelogRelease[] = [
  {
    version: "0.3.0",
    date: "2026-06-30",
    title: "Studio Vault launch",
    summary:
      "Full landing experience, refreshed workspace UI, and SEO polish for the Studio Vault rebrand.",
    changes: [
      {
        type: "added",
        text: "Marketing landing page with live demos for credentials, library browsing, model packages, InsertService scripts, and workflow walkthroughs.",
      },
      {
        type: "added",
        text: "Changelog page for tracking releases and product updates.",
      },
      {
        type: "changed",
        text: "Rebranded from RblxUploads to Studio Vault with updated typography, layout shells, and component styling.",
      },
      {
        type: "improved",
        text: "Open Graph, Twitter cards, JSON-LD, sitemap, and FAQ content for discoverability.",
      },
      {
        type: "fixed",
        text: "Cumulative layout shift on the landing hero and demo sections.",
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-06-26",
    title: "Library explorer & asset types",
    summary:
      "IndexedDB-backed library with folder tree, thumbnails, and support for audio and mesh uploads.",
    changes: [
      {
        type: "added",
        text: "Folder tree explorer with nested organization, bulk move, and root-level asset counts.",
      },
      {
        type: "added",
        text: "Upload thumbnails in the queue and library for faster visual scanning.",
      },
      {
        type: "added",
        text: "Audio uploads (MP3, OGG, WAV, FLAC) and Mesh uploads via Open Cloud.",
      },
      {
        type: "added",
        text: "IndexedDB persistence for large local libraries with export/import (JSON and CSV).",
      },
      {
        type: "improved",
        text: "Gooey search and filter controls in the asset library.",
      },
      {
        type: "fixed",
        text: "Explorer root folder selection and direct asset count display.",
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-06-20",
    title: "Initial release",
    summary:
      "Local-first batch uploader for Roblox Open Cloud image and model assets with a credential-backed upload queue.",
    changes: [
      {
        type: "added",
        text: "Drag-and-drop batch uploads for images (PNG, JPG, JPEG, WEBP) and models (FBX, GLTF, GLB, RBXM, RBXMX).",
      },
      {
        type: "added",
        text: "Concurrency-limited upload queue with per-item status, retries, and CSV/JSON export of rbxassetid results.",
      },
      {
        type: "added",
        text: "Automatic filename → Roblox display name formatting with per-file overrides.",
      },
      {
        type: "added",
        text: "Credential panel with Open Cloud API key, creator ID, parallel upload limit, and retry settings — stored in localStorage only.",
      },
      {
        type: "added",
        text: "Local Next.js proxy to Roblox Open Cloud (browser CORS workaround) with operation polling.",
      },
      {
        type: "security",
        text: "No server-side credential storage, no telemetry, and no external runtime CDN dependencies.",
      },
    ],
  },
] as const;
