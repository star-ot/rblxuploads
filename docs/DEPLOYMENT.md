# Deployment

Deploy Studio Vault on infrastructure your studio controls. This guide covers Vercel, Docker, Node.js, health checks, environment variables, and reverse-proxy patterns.

## Requirements

- Node.js 20+ (for non-Docker installs)
- Outbound HTTPS to `apis.roblox.com`
- No database, Redis, or object storage required

## Quick start (Vercel)

![Vercel](https://vercelbadge.vercel.app/api/star-ot/studio-vault)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fstar-ot%2Fstudio-vault&project-name=studio-vault&repository-name=studio-vault)

Fastest path for solo devs and small teams — no Docker or server to manage.

1. Click **Deploy with Vercel** above (or [import the repo](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fstar-ot%2Fstudio-vault) manually).
2. Confirm **Framework Preset: Next.js** and the default build settings (`npm run build`, output `.next`).
3. Deploy with **no required environment variables**. The app uses Vercel's `VERCEL_URL` / `VERCEL_PROJECT_PRODUCTION_URL` at build time for canonical links when `NEXT_PUBLIC_SITE_URL` is unset.
4. Open `https://<your-project>.vercel.app/workspace`, add credentials in the browser, and upload.

### Custom domain on Vercel

1. Add your domain in the Vercel project → **Settings → Domains**.
2. Set `NEXT_PUBLIC_SITE_URL=https://your-domain.com` in **Settings → Environment Variables** (Production).
3. Redeploy so sitemap, Open Graph, and canonical URLs use your domain.

### Optional Vercel env vars

| Variable | When to set |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Custom domain or fixed public URL for SEO |
| `RBLXUPLOADS_ALLOWED_ORIGINS` | Lock `/api/upload` CORS to your deployment origin |
| `RBLXUPLOADS_AUDIT_LOG` | `1` for structured upload audit logs |
| `RBLXUPLOADS_TRUST_PROXY` | `1` if you add an auth layer in front of Vercel |

Credentials stay in each user's browser — never add `ROBLOX_OPEN_CLOUD_KEY` to the Vercel project.

## Quick start (Docker)

```bash
docker build -t studio-vault .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://vault.yourstudio.com \
  studio-vault
```

Open `https://vault.yourstudio.com/workspace`, add Open Cloud credentials in the browser, and upload.

## npm build + start

```bash
npm ci
npm run build
npm start
```

Default port: `3000`. Set `PORT` if your platform requires it.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public URL for SEO, OG tags, and canonical links. On Vercel, auto-detected from `VERCEL_URL` when unset. |
| `PORT` | No | HTTP port (default `3000`) |
| `RBLXUPLOADS_AUDIT_LOG` | No | `1` to enable structured audit logging (Phase 3) |
| `RBLXUPLOADS_AUDIT_LOG_PATH` | No | File path for audit log; stdout if unset |
| `RBLXUPLOADS_TRUST_PROXY` | No | `1` to trust `X-Forwarded-*` and actor headers |
| `RBLXUPLOADS_ALLOWED_ORIGINS` | No | Comma-separated CORS allowlist for `/api/upload` |
| `RBLXUPLOADS_DEBUG` | No | `1` for verbose upload debug logs — not for production |

**Never set user Open Cloud keys in server env.** Credentials belong in the browser (workspace) or CI runner (CLI).

### Example `.env`

```env
NEXT_PUBLIC_SITE_URL=https://vault.yourstudio.com
RBLXUPLOADS_AUDIT_LOG=0
RBLXUPLOADS_TRUST_PROXY=1
RBLXUPLOADS_ALLOWED_ORIGINS=https://vault.yourstudio.com
```

## Health check

Load balancers should probe:

```
GET /api/health
→ 200 { "ok": true, "version": "0.5.0" }
```

## Reverse proxy — nginx

```nginx
server {
    listen 443 ssl http2;
    server_name vault.yourstudio.com;

    # TLS certificates managed by your CA / certbot

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSO actor for audit logs (set from your auth module)
        proxy_set_header X-Studio-Vault-Actor $remote_user;
    }
}
```

Restrict `/api/upload` to internal networks or authenticated users at the proxy layer.

## Reverse proxy — Caddy

```caddy
vault.yourstudio.com {
    reverse_proxy localhost:3000 {
        header_up X-Forwarded-Proto {scheme}
        header_up X-Studio-Vault-Actor {http.auth.user.id}
    }
}
```

## Cloudflare Access

1. Publish Studio Vault behind Cloudflare Access with your IdP.
2. Set `RBLXUPLOADS_TRUST_PROXY=1`.
3. Configure a Transform Rule or Worker to inject `X-Studio-Vault-Actor` from `cf.access.user.email`.
4. Enable audit logging if you need upload attribution.

## oauth2-proxy

Run oauth2-proxy in front of Studio Vault:

```bash
oauth2-proxy \
  --upstream=http://127.0.0.1:3000 \
  --set-xauthrequest=true \
  --pass-user-headers=true
```

With `RBLXUPLOADS_TRUST_PROXY=1`, audit logs use `X-Forwarded-Email` as actor.

## docker-compose

```yaml
services:
  studio-vault:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_SITE_URL: https://vault.yourstudio.com
      RBLXUPLOADS_AUDIT_LOG: "1"
      RBLXUPLOADS_TRUST_PROXY: "1"
    volumes:
      - ./audit-logs:/var/log/studio-vault
```

See `docker-compose.yml` in the repository root.

## Upgrades

1. Pull latest release tag from GitHub.
2. Rebuild image or run `npm ci && npm run build`.
3. Restart the process — no database migrations.

## Related documents

- [SECURITY.md](./SECURITY.md) — threat model and key handling
- [TEAM-WORKFLOWS.md](./TEAM-WORKFLOWS.md) — team conventions
- [AUDIT-LOGGING.md](./AUDIT-LOGGING.md) — log format (Phase 3)
- [CI.md](./CI.md) — headless CLI uploads (Phase 4)
