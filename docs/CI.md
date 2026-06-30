# CI/CD with Studio Vault CLI

Headless uploads for GitHub Actions, GitLab CI, or any runner with Node.js 20+.

## Install

From the repository root:

```bash
npm install
node packages/cli/bin/studio-vault.mjs --help
```

Or link globally:

```bash
npm link ./packages/cli
studio-vault --help
```

## Credentials

**Never commit API keys.** Use CI secrets:

| Secret | Description |
| --- | --- |
| `ROBLOX_OPEN_CLOUD_KEY` | Open Cloud key with asset scope |
| `ROBLOX_CREATOR_ID` | Numeric user or group ID |
| `ROBLOX_CREATOR_TYPE` | `user` or `group` |

Alternatively, mount `studio-vault.json` from a secret store (gitignored template: `studio-vault.json.example`).

## Commands

### Batch upload

```bash
studio-vault upload ./assets/ci \
  --profile main-group \
  --concurrency 5 \
  --format json
```

Stdout emits one JSON line per file:

```json
{"ok":true,"event":"asset.create","file":"./assets/ci/icon.png","assetType":"Image","displayName":"icon","assetId":"18472930102","operationId":"..."}
```

### Model package patch

```bash
studio-vault patch \
  --asset-id 1234567890 \
  --file ./models/hero_v2.fbx \
  --profile main-group
```

### Library export helper

```bash
# Copy existing export
studio-vault library export ./library.json --from ./exports/library.json

# Empty manifest scaffold
studio-vault library export ./.studio-vault/library.manifest.json
```

### Validate assets (policy gate)

Run before upload to enforce naming conventions on disk:

```bash
npm run validate:assets -- ./assets/ci --pattern "^UI_[A-Za-z0-9_]+$"
# or
studio-vault validate ./assets/ci --pattern "^UI_[A-Za-z0-9_]+$"
```

Exit code `1` when policy violations are found. Configure defaults via `STUDIO_VAULT_NAME_PATTERN` and `STUDIO_VAULT_MAX_NAME_LENGTH`.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | All operations succeeded |
| `1` | One or more uploads failed |
| `2` | Configuration or usage error |

## GitHub Actions example

```yaml
name: Upload CI assets

on:
  push:
    paths:
      - "assets/ci/**"

jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Upload to Roblox Open Cloud
        env:
          ROBLOX_OPEN_CLOUD_KEY: ${{ secrets.ROBLOX_OPEN_CLOUD_KEY }}
          ROBLOX_CREATOR_ID: ${{ secrets.ROBLOX_CREATOR_ID }}
          ROBLOX_CREATOR_TYPE: group
        run: |
          node packages/cli/bin/studio-vault.mjs upload ./assets/ci \
            --concurrency 3 \
            --format json | tee upload-results.jsonl

      - name: Fail on partial upload
        run: |
          if grep -q '"ok":false' upload-results.jsonl 2>/dev/null; then
            echo "One or more uploads failed"
            exit 1
          fi
```

## Image + Model smoke test

```bash
mkdir -p /tmp/sv-test
# Add a small PNG and FBX to /tmp/sv-test
export ROBLOX_OPEN_CLOUD_KEY=...
export ROBLOX_CREATOR_ID=...
export ROBLOX_CREATOR_TYPE=user

node packages/cli/bin/studio-vault.mjs upload /tmp/sv-test --format json
node packages/cli/bin/studio-vault.mjs patch --asset-id <id> --file /tmp/sv-test/model.fbx
```

## Related

- [TEAM-WORKFLOWS.md](./TEAM-WORKFLOWS.md)
- [SECURITY.md](./SECURITY.md)
- [AUDIT-LOGGING.md](./AUDIT-LOGGING.md)
