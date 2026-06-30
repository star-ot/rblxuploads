# Studio Vault (rblxuploads)

**Made by [StarVSK](https://starvsk.dev)**

Local-first Roblox asset workspace — bulk Open Cloud uploads, IndexedDB library, model package PATCH, InsertService scripts, and multi-profile credentials. MIT licensed. No telemetry.

The only outbound network traffic is to `apis.roblox.com` when you upload.

- **Product site:** [/teams](https://uploader.starvsk.dev/teams) — self-hosting & security for studios
- **Workspace:** [/workspace](https://uploader.starvsk.dev/workspace)

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

Or `docker compose up`. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Health check: `GET /api/health` → `{ "ok": true, "version": "…", "metrics": { … } }`

Metrics (self-hosted): `GET /api/metrics` — Prometheus text or `?format=json`

## CLI (CI/CD)

```bash
npm run cli -- upload ./assets/ci --concurrency 5 --format json
npm run cli -- validate ./assets/ci --pattern "^UI_[A-Za-z0-9_]+$"
```

Credentials via env: `ROBLOX_OPEN_CLOUD_KEY`, `ROBLOX_CREATOR_ID`, `ROBLOX_CREATOR_TYPE` — or `studio-vault.json` (see `studio-vault.json.example`).

Full guide: [docs/CI.md](docs/CI.md) · GitHub Actions: [.github/workflows/studio-vault-upload.yml](.github/workflows/studio-vault-upload.yml)

## Features

- Batch uploads: Image, Audio, Model, Mesh (PNG, JPG, WEBP, MP3, OGG, WAV, FLAC, FBX, GLTF, GLB, RBXM, RBXMX, MESH)
- Local library with folders, tags, search, export/import, **Git sync with merge**
- **Asset versioning** — upload a new version from the library, browse prior rbxassetids with previews via the Versions dropdown, compact v3 export for Git
- **Upload policy** — enforce naming patterns and image dimensions in the workspace and CI (`studio-vault validate`)
- Model package in-place PATCH (FBX)
- InsertService Luau script generator
- Multi-profile credential switching (localStorage only)
- **Observability** — `/api/metrics`, live counters in Settings
- **Webhooks** — Slack/Discord batch-complete notifications (optional)
- Optional audit logging for self-hosted deploys
- `studio-vault` CLI for pipelines

## Documentation

| Doc | Purpose |
| --- | --- |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model, data flows |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, env vars, reverse proxy |
| [docs/TEAM-WORKFLOWS.md](docs/TEAM-WORKFLOWS.md) | Git library sync, profiles |
| [docs/AUDIT-LOGGING.md](docs/AUDIT-LOGGING.md) | Structured upload logs |
| [docs/CI.md](docs/CI.md) | GitHub Actions example |

## Security model

- No server-side credential storage by default
- No telemetry or third-party CDNs
- API keys in browser localStorage; per-request proxy to Roblox only
- Optional `RBLXUPLOADS_AUDIT_LOG=1` — never logs keys or file bytes

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (policy, metrics, versioning, library export, CLI validate) |
| `npm run cli` | Studio Vault CLI |
| `npm run validate:assets` | Policy-check a folder (`--pattern`, `--max-name-length`) |

## License

[MIT](LICENSE) — Copyright (c) 2026 StarVSK
