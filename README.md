# RblxUploads

**Made by [StarVSK](https://github.com/star-ot)**

Local batch uploader for Roblox Open Cloud **Image** assets. Queue dozens of PNGs, name them, upload with controlled concurrency, and copy the resulting `rbxassetid://` values.

Runs entirely on your machine. The only outbound network traffic is to `apis.roblox.com` when you start a batch.

## Features

- Drag-and-drop or file-picker batch uploads (PNG, JPG, JPEG, WEBP)
- Automatic filename → Roblox display name formatting (editable per file)
- Concurrency-limited queue with retries
- Per-item status: Queued → Sending → Roblox → Done / Error
- Copy individual IDs, copy all, or export JSON results
- Credentials stored in browser `localStorage` only

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste your Open Cloud API key and creator ID, add images, and hit **Start batch**.

No `.env` file is required.

## Configuration

All settings live in the in-app **Credentials** panel and persist in `localStorage`:

| Field | Description |
| --- | --- |
| Open Cloud API key | From [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials) |
| Creator ID | Numeric user or group ID that owns the assets |
| Creator type | `user` or `group` |
| Parallel uploads | 1–10 concurrent requests |
| Retry attempts | 0–5 retries per failed file |

## Security model

This app is designed for local, open-source use:

- **No server-side credential storage** — no `.env` fallbacks, no database, no Vercel Blob
- **No telemetry** — no analytics, no external fonts, no CDN dependencies
- **API keys stay in your browser** until you upload; they are sent per-request to your local Next.js server, which proxies to Roblox (required because Roblox blocks direct browser CORS calls)
- **Never commit real API keys** — `.env*` is gitignored; rotate any key that was ever shared

## Roblox API flow

1. Browser sends image + metadata to `POST /api/upload` (local)
2. Server forwards multipart request to `POST https://apis.roblox.com/assets/v1/assets`
3. Server polls `GET …/operations/{operationId}` until complete
4. `assetId` returns to the browser; queue UI updates live

Assets are created with `assetType: "Image"`.

## Project structure

```text
app/
  api/upload/route.ts       # local proxy — sole external network caller
  page.tsx                  # queue orchestration
  globals.css               # StarVSK theme (system fonts only)
components/
  layout/                   # header + footer
  SettingsPanel.tsx
  Uploader.tsx
  UploadQueue.tsx
  AssetCard.tsx
  ResultsTable.tsx
hooks/
  usePersistedConfig.ts     # localStorage sync
lib/
  config/                   # constants + storage helpers
  roblox/client.ts          # Open Cloud create + poll (server-only)
  upload/                   # browser client + concurrency queue
  file-parser.ts
  name-formatter.ts
  types.ts
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint

## License

MIT — see [LICENSE](LICENSE) (add before publishing if not present).

## Contributing

Issues and PRs welcome. Include reproduction steps and expected vs actual behavior for bugs.
