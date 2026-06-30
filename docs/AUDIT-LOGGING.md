# Audit Logging

Optional structured audit logging for self-hosted Studio Vault instances. Enable when your security or ops team needs upload attribution without storing API keys or file contents.

## Enable

```env
RBLXUPLOADS_AUDIT_LOG=1
# Optional — write to file instead of stdout
RBLXUPLOADS_AUDIT_LOG_PATH=/var/log/studio-vault/audit.jsonl
# Required for actor attribution from SSO proxy
RBLXUPLOADS_TRUST_PROXY=1
```

Set `NEXT_PUBLIC_RBLXUPLOADS_AUDIT_LOG=1` to show the enabled state in the workspace Instance info panel.

## Log format

One JSON object per line (JSONL):

```json
{
  "ts": "2026-06-30T14:22:01.123Z",
  "event": "asset.create",
  "actor": "artist@studio.example",
  "creatorId": "12345678",
  "creatorType": "group",
  "assetId": "18472930102",
  "displayName": "UI_IconHome",
  "fileName": "icon_home.png",
  "assetType": "Image",
  "status": "success",
  "durationMs": 2341,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Events

| `event` | Description |
| --- | --- |
| `asset.create` | `POST /api/upload` — new asset |
| `asset.patch` | `PATCH /api/upload` — model package update |

### Fields

| Field | Always present | Notes |
| --- | --- | --- |
| `ts` | Yes | ISO 8601 UTC |
| `event` | Yes | See above |
| `actor` | No | From `X-Studio-Vault-Actor` or `X-Forwarded-Email` when trust proxy enabled |
| `creatorId` | Yes | Roblox user/group ID |
| `creatorType` | Yes | `user` or `group` |
| `assetId` | On success | Resulting rbxassetid |
| `displayName` | Yes | Formatted display name |
| `fileName` | Yes | Original filename |
| `assetType` | Yes | Image, Audio, Model, Mesh |
| `status` | Yes | `success` or `failure` |
| `error` | On failure | Sanitized message — never contains API keys |
| `durationMs` | Yes | Server processing time |
| `requestId` | Yes | UUID per request |

## Never logged

- `apiKey` or `x-api-key` values
- File bytes or base64 content
- Raw Roblox error payloads that may echo secrets
- IndexedDB library data
- Full `Authorization` headers

## Actor attribution

Configure your reverse proxy to inject identity after SSO:

### Cloudflare Access

Transform rule or Worker header:

```
X-Studio-Vault-Actor: <user email from JWT>
```

### oauth2-proxy

With `--pass-user-headers=true` and `RBLXUPLOADS_TRUST_PROXY=1`, the server reads `X-Forwarded-Email`.

### nginx

```nginx
proxy_set_header X-Studio-Vault-Actor $remote_user;
```

## Shipping logs

### Datadog

```text
source:studio-vault service:roblox-uploads
@event:asset.create @status:failure
```

### Logstash filter

```ruby
filter {
  if [message] =~ /^\{/ {
    json { source => "message" }
  }
}
```

### jq examples

```bash
# Failed uploads in the last hour
cat audit.jsonl | jq -c 'select(.status=="failure")'

# Uploads by actor
cat audit.jsonl | jq -r '.actor' | sort | uniq -c
```

## Audit API (not public)

Do **not** expose raw audit logs via a public route. If you need a read API:

1. Terminate auth at nginx / Cloudflare Access
2. Mount log files on a separate internal service
3. Prefer log shipping (Fluent Bit, Vector, CloudWatch agent) over building an in-app audit UI

A future `GET /api/audit` may be added behind mandatory proxy auth — document that it must never be internet-facing.

## Related

- [SECURITY.md](./SECURITY.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
