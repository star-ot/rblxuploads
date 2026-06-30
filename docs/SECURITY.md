# Security

Studio Vault (rblxuploads) is a local-first, MIT-licensed Roblox asset workspace. This document describes the threat model, data flows, logging behavior, and recommended hardening for self-hosted deployments.

## Summary

| Property | Default behavior |
| --- | --- |
| Credential metadata | Browser `localStorage` (labels, creator IDs — no secrets) |
| Credential secrets | Browser IndexedDB, AES-GCM encrypted (API keys, webhook signing secret) |
| Asset library | Browser IndexedDB — not on server |
| External network | Roblox Open Cloud (`apis.roblox.com`) only |
| Telemetry | None |
| Server persistence | None (stateless proxy) |

## Threat model

### Assets we protect

- Open Cloud API keys (high sensitivity)
- Asset library metadata (medium — may include internal project names, rbxassetids)
- Upload file bytes in transit (medium — game art/audio/models)

### Trust boundaries

```
[Developer browser]  →  [Your Studio Vault instance]  →  [Roblox Open Cloud]
     untrusted              you control                      third party
```

The browser is untrusted from the server's perspective (any user can POST to `/api/upload`). The server must never persist secrets. Your reverse proxy is the trust boundary for SSO attribution when audit logging is enabled.

### Out of scope

Studio Vault does not provide:

- In-app authentication or RBAC
- SOC 2 certified infrastructure
- Encrypted at-rest server storage (there is no server database)
- Protection against XSS on your origin (client-side encryption does not help if script can call decrypt)
- Protection against a malicious insider with valid Open Cloud keys (they can upload to Roblox directly)

## Credential vault

Studio Vault splits credential storage:

| Data | Storage | Encrypted? |
| --- | --- | --- |
| Profile `id`, `label`, `creatorId`, `creatorType`, timestamps | `localStorage` | No |
| `activeProfileId`, concurrency, policy, webhook URL | `localStorage` | No |
| API keys per profile | IndexedDB (`rblxuploads-credential-vault`) | **Yes** (AES-GCM) |
| Webhook signing secret | IndexedDB | **Yes** |

Encryption uses the Web Crypto API (PBKDF2 + AES-GCM). No additional dependencies.

### Device-bound mode (default)

On first visit, Studio Vault generates a random 256-bit device key in IndexedDB and encrypts secrets automatically. Solo developers get zero-friction protection against:

- Casual DevTools inspection of plaintext keys in `localStorage`
- Copying `localStorage` to another machine (ciphertext is useless without the device key)

This does **not** protect against same-machine malware or XSS — treat network placement and CSP as mandatory for enterprise deploys.

### Passphrase mode (opt-in)

Studios and shared VMs can enable **Settings → Credential vault → Passphrase vault**:

- Secrets decrypt only after unlock; plaintext keys live in memory until lock
- Optional auto-lock after N minutes idle
- Optional lock when the tab loses focus
- Optional **remember on this device** — wraps the unlock key with the device key for faster daily unlock

Profile metadata remains visible when locked so teams do not lose profile labels or creator IDs.

### Migration

Configs saved as plaintext in `localStorage` v4 migrate automatically to encrypted v5 on first load. Functionality is unchanged after migration.

## Data flows

### Upload (POST /api/upload)

1. User selects files and active credential profile in the browser.
2. Browser sends `multipart/form-data` to your instance: file bytes, `apiKey`, `creatorId`, `creatorType`, display name.
3. Server forwards the request to `POST https://apis.roblox.com/assets/v1/assets`.
4. Server polls the operation until complete.
5. Response (`assetId`, status) returns to the browser. Library entry saved in IndexedDB.

**What transits your server:** file bytes and API key for the duration of the request only. Neither is written to disk by default.

### Model package update (PATCH /api/upload)

Same pattern — FBX bytes and metadata forwarded to Roblox `PATCH /assets/v1/assets/{assetId}`.

### What never hits your server (at rest)

- IndexedDB library records
- Encrypted credential vault blobs
- Profile metadata in localStorage
- Historical upload queue state

## Key handling

| Location | Keys stored? |
| --- | --- |
| Browser localStorage | **No** (metadata only) |
| Browser IndexedDB (credential vault) | **Yes** (encrypted) |
| Studio Vault server | **No** |
| Server logs (default) | **No** |
| Audit log (optional) | **No** — keys are never logged |
| `.env` on server | Not used for user keys |
| CI runner secrets | **Yes** (env / pipeline store — separate from browser vault) |

**CI/CD:** Use `ROBLOX_OPEN_CLOUD_KEY` on the runner or in pipeline secrets for the `studio-vault` CLI — not on the Studio Vault web instance.

## Logging

### Default (production)

- No structured audit log
- `RBLXUPLOADS_DEBUG=1` may log non-secret debug metadata — do not enable in production

### Optional audit log (`RBLXUPLOADS_AUDIT_LOG=1`)

Structured JSON lines per upload attempt. Fields: timestamp, event, actor, creatorId, creatorType, assetId, displayName, fileName, assetType, status, sanitized error, durationMs, requestId.

**Never logged:** `apiKey`, raw form fields containing secrets, file bytes, full Roblox error bodies that may echo request content.

See [AUDIT-LOGGING.md](./AUDIT-LOGGING.md).

## Recommended proxy headers

When `RBLXUPLOADS_TRUST_PROXY=1`, the server may read:

| Header | Purpose |
| --- | --- |
| `X-Studio-Vault-Actor` | Preferred actor ID for audit log (set by your SSO proxy) |
| `X-Forwarded-Email` | Fallback actor from oauth2-proxy / Cloudflare Access |
| `X-Forwarded-For` | Client IP (for ops correlation only) |
| `X-Forwarded-Proto` | HTTPS detection behind TLS terminator |

**Do not expose `/api/upload` publicly without network controls.** Place Studio Vault behind VPN, internal DNS, or an identity-aware proxy.

## Security headers

Production deployments should serve:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (or `SAMEORIGIN` if embedding is required)
- `Referrer-Policy: strict-origin-when-cross-origin`
- Content-Security-Policy compatible with Next.js inline requirements

See [DEPLOYMENT.md](./DEPLOYMENT.md) for implementation.

## CORS lockdown

Optional `RBLXUPLOADS_ALLOWED_ORIGINS` restricts browser origins that may call `/api/upload`. Set to your internal studio URL when self-hosting.

## Reporting vulnerabilities

Report security issues via GitHub Security Advisories on the repository or email the maintainer listed in the README. Do not disclose API keys in reports.

## Related documents

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Docker, env vars, reverse proxy
- [TEAM-WORKFLOWS.md](./TEAM-WORKFLOWS.md) — Git sync, profile conventions
- [AUDIT-LOGGING.md](./AUDIT-LOGGING.md) — structured log format and shipping
