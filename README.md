# Roblox Open Cloud Asset Uploader

Modern Next.js tool for batch uploading images to Roblox Open Cloud as **Image** assets (not Decals), with queueing, retry handling, and live per-file status.

## Features

- Batch image uploads (50+ files): drag-and-drop and file picker
- Supported file types: `PNG`, `JPG`, `JPEG`, `WEBP`
- Automatic filename-to-Roblox name formatting (editable before upload)
- Controlled concurrency queue with retries and fault tolerance
- Per-item status tracking: `Waiting`, `Uploading`, `Processing`, `Complete`, `Failed`
- Results table with per-item copy, bulk copy (names + IDs), and JSON export
- Server-side upload proxy route for Roblox API requests (`/api/upload`)

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- React + TypeScript
- Tailwind CSS
- Roblox Open Cloud Assets API

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

You can configure the uploader in-app from the **Configuration** panel:

- `Roblox Open Cloud API Key`
- `Creator ID`
- `Creator Type` (`user` or `group`)
- `PUBLIC_BLOB_READ_WRITE_TOKEN` (stored for workflow compatibility)
- Queue tuning (`Concurrency`, `Max Retries`)

Settings are persisted in browser `localStorage`.

### Optional environment variable

You may provide a server-side fallback API key:

```env
ROBLOX_OPEN_CLOUD_API_KEY=your_key_here
```

If this is set, the server route can use it as a fallback when no key is provided from the UI.

## Security Notes (Important for Open Source)

- Never commit real API keys or tokens.
- Rotate any credentials that have ever been committed or shared.
- Keep `.env` out of version control and provide only a `.env.example` with placeholders.
- Roblox upload calls are proxied through server routes to avoid direct client-to-Roblox API calls.

## Roblox API Flow

1. Client sends image + metadata to `POST /api/upload`
2. Server sends multipart request to `POST https://apis.roblox.com/assets/v1/assets`
3. Server polls `GET https://apis.roblox.com/assets/v1/operations/{operationId}`
4. Server returns `assetId` to client
5. UI updates queue state and results table without refresh

Assets are created as:

- `assetType: "Image"`

## Project Structure

```text
app/
  api/upload/route.ts      # secure server upload proxy
  page.tsx                 # main app UI and queue orchestration
components/
  SettingsPanel.tsx
  Uploader.tsx
  UploadQueue.tsx
  ResultsTable.tsx
  AssetCard.tsx
lib/
  roblox-client.ts         # Roblox API create + poll logic
  queue-manager.ts         # controlled concurrency processing
  upload-client.ts         # browser -> /api/upload client helper
  file-parser.ts           # supported type checks
  name-formatter.ts        # filename -> Roblox-friendly name
  types.ts                 # shared types
```

## Scripts

- `npm run dev` - start local development server
- `npm run lint` - run ESLint
- `npm run build` - build production app
- `npm run start` - serve production build

## Known Notes

- `PUBLIC_BLOB_READ_WRITE_TOKEN` is captured in settings for compatibility with broader workflows, but current upload flow is Roblox Open Cloud direct via the server route.
- Next.js version in this repo may include breaking changes vs older docs; verify against your installed version when extending.

## Contributing

Issues and PRs are welcome. Please include:

- clear reproduction steps for bugs
- expected vs actual behavior
- screenshots/GIFs for UI issues when possible

## License

Add your preferred license before publishing (for example MIT).
