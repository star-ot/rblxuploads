# Team Workflows

Studio Vault has no cloud-synced library and no shared user accounts. Teams collaborate through **portable exports**, **Git**, and **documented conventions** — the same local-first model solo developers use, scaled with process.

## Principles

1. **Roblox is the source of truth for assets** — rbxassetids exist on Roblox after upload.
2. **Git is the source of truth for metadata** — names, folders, tags, and IDs your team needs day-to-day.
3. **API keys never go in Git** — use per-developer encrypted browser vault or CI secrets.
4. **Each developer has their own IndexedDB** — merge imports; don't expect live sync.

## Credential profile conventions

### Naming

Use a consistent profile label per publishing context:

| Profile label | Creator type | Creator ID | Key holder |
| --- | --- | --- | --- |
| `main-group` | group | `12345678` | Group Open Cloud key (lead only) |
| `personal-dev` | user | `98765432` | Individual dev key |
| `ugc-alt` | group | `11111111` | UGC publishing group |

Store this table in your internal wiki — not in the repo with keys.

### Per-group switching

Before each batch upload, switch the active profile in the workspace header. Wrong profile = assets owned by the wrong creator.

### Profile metadata export (Phase 5)

Optional export of labels and creator IDs **without** API keys. Keys require explicit opt-in with a confirmation dialog.

### Credential vault for studios

Default **device-bound** encryption is automatic and needs no setup — ideal for solo devs.

For shared VMs or loaner laptops, enable **Settings → Credential vault → Passphrase vault**:

| Setting | Enterprise value | Solo impact |
| --- | --- | --- |
| Auto-lock timeout | Locks keys after idle time on shared machines | Off by default |
| Passphrase mode | Lead-held group keys stay encrypted at rest | Optional |
| Lock on tab blur | Keys cleared when switching away | Off by default |
| Remember on this device | Faster unlock on trusted workstations | Optional |
| Export with keys | Still blocked by default confirmation | Unchanged |

CI pipelines continue using `ROBLOX_OPEN_CLOUD_KEY` in runner secrets — separate from the browser vault.

## Library sync via Git

### Export from workspace

1. Open **Library** → **Export** → JSON (full metadata) or CSV (flat list).
2. For team repos, prefer the manifest format (Phase 5):

```text
your-game-repo/
  .studio-vault/
    library.manifest.json   # canonical metadata
```

### Commit workflow

```bash
# Artist or TA exports after upload session
cp ~/Downloads/library-export.json .studio-vault/library.manifest.json
git add .studio-vault/library.manifest.json
git commit -m "chore(assets): sync UI icons batch"
git push
```

### Import on another machine

1. `git pull`
2. Workspace → **Sync from repo** (Phase 5) or **Import** → select `library.manifest.json`
3. Resolve conflicts: keep local, keep remote, or keep both

### Merge rules (recommended)

| Conflict | Resolution |
| --- | --- |
| Same `assetId`, different tags | Union tags |
| Same `assetId`, different folder | Prefer remote (Git canonical) |
| Local-only asset | Keep local unless explicitly pruning |
| Remote-only asset | Add to local library |

## CI integration overview

For automated uploads (icons, audio stubs, placeholder meshes):

1. Store `ROBLOX_OPEN_CLOUD_KEY`, `ROBLOX_CREATOR_ID`, `ROBLOX_CREATOR_TYPE` in GitHub Actions secrets.
2. Run `studio-vault upload ./assets/ci --profile main-group --format json` (Phase 4).
3. Pipe JSON lines into a step that updates `library.manifest.json` or posts to your tracker.

See [CI.md](./CI.md) when available.

## Audit trail for teams

When your self-hosted instance has `RBLXUPLOADS_AUDIT_LOG=1`:

- Ship logs to your SIEM (Datadog, Logstash, CloudWatch).
- Correlate `actor` header with SSO identity.
- Do **not** expose `GET /api/audit` publicly — terminate auth at the proxy.

See [AUDIT-LOGGING.md](./AUDIT-LOGGING.md).

## Roles (process, not in-app RBAC)

| Role | Typical access |
| --- | --- |
| Artist / TA | Workspace URL, personal or group profile, library export |
| Pipeline engineer | Docker host, CI secrets, manifest commits |
| IT / Security | SECURITY.md review, proxy SSO, log retention policy |
| Lead | Group Open Cloud key rotation |

## Anti-patterns

- Committing `studio-vault.json` with API keys
- Sharing one browser profile on a shared VM (IndexedDB collision) — use passphrase vault + lock on exit
- Expecting real-time library sync without Git pull + import
- Hosting Studio Vault on the public internet without Access/VPN

## Related documents

- [SECURITY.md](./SECURITY.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [CI.md](./CI.md)
