# Studio Vault (rblxuploads)

![Vercel](https://vercelbadge.vercel.app/api/star-ot/studio-vault)

**Made by [StarVSK](https://starvsk.dev)**

Local-first Roblox asset workspace — bulk Open Cloud uploads, IndexedDB library, model package PATCH, InsertService scripts, and multi-profile credentials. MIT licensed. No telemetry.

The only outbound network traffic is to `apis.roblox.com` when you upload.

- **Product site:** [/teams](https://uploader.starvsk.dev/teams) — self-hosting & security for studios
- **Workspace:** [/workspace](https://uploader.starvsk.dev/workspace)

## Quick start (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fstar-ot%2Fstudio-vault&project-name=studio-vault&repository-name=studio-vault)

1. Click **Deploy** and import [star-ot/studio-vault](https://github.com/star-ot/studio-vault).
2. Leave environment variables empty for a first deploy — Studio Vault detects `VERCEL_URL` for SEO and canonical links.
3. Open `/workspace`, add Open Cloud credentials, and upload.

After you add a custom domain, set `NEXT_PUBLIC_SITE_URL` to that URL in the Vercel project settings and redeploy so Open Graph and sitemap links stay correct.

Optional: `RBLXUPLOADS_ALLOWED_ORIGINS` if you lock CORS to your deployment origin. See [DEPLOYMENT.md — Vercel](https://github.com/star-ot/studio-vault/blob/master/docs/DEPLOYMENT.md#quick-start-vercel).

## Quick start (local dev)

```bash
npm install
npm run dev
```

Open [http://localhost:3000/workspace](http://localhost:3000/workspace), add Open Cloud credentials, queue files, and hit **Start upload**.

No `.env` required for solo dev use.

## Docker (self-host)

```bash
docker build -t studio-vault .
docker run -p 3000:3000 -e NEXT_PUBLIC_SITE_URL=http://localhost:3000 studio-vault
```

Or `docker compose up`. See [docs/DEPLOYMENT.md](https://github.com/star-ot/studio-vault/blob/master/docs/DEPLOYMENT.md).

Health check: `GET /api/health` → `{ "ok": true, "version": "…", "metrics": { … } }`

Metrics (self-hosted): `GET /api/metrics` — Prometheus text or `?format=json`

## CLI (CI/CD)

```bash
npm run cli -- upload ./assets/ci --concurrency 5 --format json
npm run cli -- validate ./assets/ci --pattern "^UI_[A-Za-z0-9_]+$"
```

Credentials via env: `ROBLOX_OPEN_CLOUD_KEY`, `ROBLOX_CREATOR_ID`, `ROBLOX_CREATOR_TYPE` — or `studio-vault.json` (see `studio-vault.json.example`).

Full guide: [docs/CI.md](https://github.com/star-ot/studio-vault/blob/master/docs/CI.md) · GitHub Actions: [.github/workflows/studio-vault-upload.yml](.github/workflows/studio-vault-upload.yml)

## Features

- Batch uploads: Image, Audio, Model, Mesh (PNG, JPG, WEBP, MP3, OGG, WAV, FLAC, FBX, GLTF, GLB, RBXM, RBXMX, MESH)
- Local library with folders, tags, search, export/import, **Git sync with merge**
- **Asset versioning** — upload a new version from the library, browse prior rbxassetids with previews via the Versions dropdown, compact v3 export for Git
- **Upload policy** — enforce naming patterns and image dimensions in the workspace and CI (`studio-vault validate`)
- Model package in-place PATCH (FBX)
- InsertService Luau script generator
- Multi-profile credential switching with **encrypted credential vault** (IndexedDB + Web Crypto)
- **Observability** — `/api/metrics`, live counters in Settings
- **Webhooks** — Slack/Discord batch-complete notifications (optional)
- Optional audit logging for self-hosted deploys
- `studio-vault` CLI for pipelines

## Credential vault

Profile metadata (labels, creator IDs) stays in `localStorage`. API keys and webhook secrets are encrypted in IndexedDB with AES-GCM.

| Mode | Who it's for | Behavior |
| --- | --- | --- |
| **Device-bound** (default) | Solo devs | Auto-encrypt on first visit. No unlock step. Blocks casual storage inspection and copying `localStorage` to another PC. |
| **Passphrase** (opt-in) | Studios / shared VMs | Unlock each session. Optional auto-lock, tab-blur lock, and remember-on-device. |

Existing plaintext v4 settings migrate automatically on first load. CI/CD continues to use `ROBLOX_OPEN_CLOUD_KEY` on the runner — separate from the browser vault.

Configure vault mode in **Settings → Credential vault**.

## Documentation

| Doc | Purpose |
| --- | --- |
| [SECURITY.md](https://github.com/star-ot/studio-vault/blob/master/docs/SECURITY.md) | Threat model, data flows, credential vault |
| [DEPLOYMENT.md](https://github.com/star-ot/studio-vault/blob/master/docs/DEPLOYMENT.md) | Vercel, Docker, env vars, reverse proxy |
| [TEAM-WORKFLOWS.md](https://github.com/star-ot/studio-vault/blob/master/docs/TEAM-WORKFLOWS.md) | Git library sync, profiles |
| [AUDIT-LOGGING.md](https://github.com/star-ot/studio-vault/blob/master/docs/AUDIT-LOGGING.md) | Structured upload logs |
| [CI.md](https://github.com/star-ot/studio-vault/blob/master/docs/CI.md) | GitHub Actions example |

## Security model

- No server-side credential storage by default
- No telemetry or third-party CDNs
- API keys encrypted in browser IndexedDB; profile metadata in localStorage; per-request proxy to Roblox only
- Optional passphrase vault with auto-lock for shared machines
- Optional `RBLXUPLOADS_AUDIT_LOG=1` — never logs keys or file bytes

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (policy, metrics, versioning, library export, CLI validate, credential vault) |
| `npm run cli` | Studio Vault CLI |
| `npm run validate:assets` | Policy-check a folder (`--pattern`, `--max-name-length`) |

## License

[MIT](LICENSE) — Copyright (c) 2026 StarVSK
