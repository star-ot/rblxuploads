import { siteConfig } from "@/lib/seo/site";

export function docsUrl(filename: string): string {
  return `${siteConfig.links.github}/blob/main/docs/${filename}`;
}

export const TEAMS_WHY_ITEMS = [
  {
    title: "Bulk Open Cloud uploads",
    description:
      "Queue images, audio, models, and meshes with concurrency control, retries, and per-item status — the daily pipeline Creator Dashboard wasn't built for.",
  },
  {
    title: "Model package PATCH",
    description:
      "Replace FBX content on an existing rbxassetid without breaking references. Ship iterative art passes without re-wiring every script.",
  },
  {
    title: "InsertService scripts",
    description:
      "Generate Luau loaders from your library for instant Studio workspace loading during development and QA.",
  },
  {
    title: "Multi-profile groups",
    description:
      "Separate credential profiles per user or group. Switch from the header before each batch — keys stay in the browser.",
  },
  {
    title: "Zero telemetry",
    description:
      "No analytics, no third-party CDNs, no cloud-synced libraries. MIT licensed. Auditable source you can fork and deploy.",
  },
] as const;

export const TEAMS_SECURITY_NODES = [
  {
    id: "browser",
    label: "Developer browser",
    detail: "IndexedDB library, localStorage credential profiles, upload queue UI",
    stays: true,
  },
  {
    id: "proxy",
    label: "Self-hosted Next.js proxy",
    detail: "POST /api/upload — forwards multipart to Roblox; optional audit log (no secrets)",
    stays: false,
  },
  {
    id: "roblox",
    label: "Roblox Open Cloud",
    detail: "apis.roblox.com — sole external network destination",
    stays: false,
  },
] as const;

export const TEAMS_NEVER_LEAVES = [
  "Asset library metadata (IndexedDB)",
  "Credential profiles at rest (localStorage — browser only)",
  "API keys on the server (never stored server-side by default)",
  "File bytes after upload completes (not persisted on server)",
  "Telemetry or analytics payloads",
] as const;

export const TEAMS_DEPLOY_OPTIONS = [
  {
    id: "docker",
    title: "Docker (recommended)",
    description: "Multi-stage production image, non-root user, port 3000.",
    snippet: `docker build -t studio-vault .
docker run -p 3000:3000 \\
  -e NEXT_PUBLIC_SITE_URL=https://vault.yourstudio.com \\
  studio-vault`,
    language: "bash" as const,
  },
  {
    id: "npm",
    title: "npm build + start",
    description: "Standard Node deployment behind your existing reverse proxy.",
    snippet: `npm ci
npm run build
npm start`,
    language: "bash" as const,
  },
  {
    id: "proxy",
    title: "Behind reverse proxy",
    description: "Terminate TLS at nginx, Caddy, or Cloudflare Access. Inject SSO actor headers for audit logs.",
    snippet: `# nginx — forward actor from SSO
proxy_set_header X-Studio-Vault-Actor $remote_user;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;`,
    language: "nginx" as const,
  },
] as const;

export const TEAMS_WORKFLOW_ITEMS = [
  {
    title: "Git-backed library sync",
    description:
      "Export library.json or CSV from any teammate's workspace. Commit the canonical manifest to your game repo. Others import or merge on pull.",
  },
  {
    title: "Credential profiles per group",
    description:
      "Label profiles by experience or publishing group. Document which Open Cloud key maps to which creator ID in your internal runbook — keys never go in Git.",
  },
  {
    title: "Optional audit logging",
    description:
      "Enable RBLXUPLOADS_AUDIT_LOG=1 on your instance. Structured JSON lines per upload — actor, asset ID, status — never API keys or file contents.",
  },
  {
    title: "CI/CD via CLI",
    description:
      "Headless studio-vault upload for pipelines. Machine-readable JSON lines, env-based credentials, GitHub Actions examples in docs/CI.md.",
  },
] as const;

export type ComparisonCell = "yes" | "partial" | "no" | string;

export interface ComparisonRow {
  feature: string;
  studioVault: ComparisonCell;
  creatorDashboard: ComparisonCell;
  buildInHouse: ComparisonCell;
}

export const TEAMS_COMPARISON: ComparisonRow[] = [
  {
    feature: "Bulk upload queue with retries",
    studioVault: "yes",
    creatorDashboard: "partial",
    buildInHouse: "yes",
  },
  {
    feature: "Local searchable asset library",
    studioVault: "yes",
    creatorDashboard: "no",
    buildInHouse: "partial",
  },
  {
    feature: "Model package in-place PATCH",
    studioVault: "yes",
    creatorDashboard: "partial",
    buildInHouse: "yes",
  },
  {
    feature: "InsertService script generator",
    studioVault: "yes",
    creatorDashboard: "no",
    buildInHouse: "partial",
  },
  {
    feature: "Self-hosted / air-gapped deploy",
    studioVault: "yes",
    creatorDashboard: "no",
    buildInHouse: "yes",
  },
  {
    feature: "No vendor holds your API keys",
    studioVault: "yes",
    creatorDashboard: "yes",
    buildInHouse: "yes",
  },
  {
    feature: "Zero telemetry by default",
    studioVault: "yes",
    creatorDashboard: "no",
    buildInHouse: "partial",
  },
  {
    feature: "Time to ship",
    studioVault: "Minutes",
    creatorDashboard: "Immediate",
    buildInHouse: "Weeks–months",
  },
  {
    feature: "Maintenance burden",
    studioVault: "Low (OSS updates)",
    creatorDashboard: "None",
    buildInHouse: "High",
  },
];

export const TEAMS_FAQ = [
  {
    question: "Where are Open Cloud API keys stored?",
    answer:
      "In the browser's localStorage on each developer machine — never on the Studio Vault server by default. During upload, keys travel per-request from browser → your self-hosted proxy → Roblox. For CI, keys live in the pipeline secret store or runner env, not in the Studio Vault instance.",
  },
  {
    question: "What data leaves our network?",
    answer:
      "Only upload requests to Roblox Open Cloud (file bytes + asset metadata required by the API). Library data, credential profiles at rest, and telemetry never leave your controlled environment unless you explicitly export them.",
  },
  {
    question: "Where does data reside?",
    answer:
      "Asset libraries live in each user's browser IndexedDB. Self-hosted Studio Vault stores no user database. Optional audit logs write to stdout or a file path you configure on your infrastructure.",
  },
  {
    question: "What gets logged when audit logging is enabled?",
    answer:
      "Timestamp, event type (create/patch), optional actor header, creator ID/type, asset ID, display name, file name, asset type, status, duration, and request ID. API keys, file contents, and raw Roblox error payloads with secrets are never logged.",
  },
  {
    question: "Can we integrate SSO?",
    answer:
      "Studio Vault has no in-app user accounts. Place it behind your identity proxy (Cloudflare Access, oauth2-proxy, nginx auth) and forward X-Studio-Vault-Actor or X-Forwarded-Email when RBLXUPLOADS_TRUST_PROXY=1 for audit attribution. See docs/DEPLOYMENT.md.",
  },
  {
    question: "Is this multi-tenant SaaS?",
    answer:
      "No. Each studio deploys their own instance. There are no shared accounts, billing tiers, or cloud-synced libraries. Team workflows use Git-exported manifests and documented conventions — not a vendor database.",
  },
  {
    question: "How do teams share libraries without a cloud backend?",
    answer:
      "Export JSON/CSV from the workspace, commit library.manifest.json to your game repo, and import or merge on other machines. Credential metadata (labels, creator IDs) can export separately — API keys require explicit opt-in with confirmation.",
  },
  {
    question: "What compliance certifications does Studio Vault have?",
    answer:
      "Studio Vault is MIT open source you self-host. It is not a SOC 2 certified SaaS. Security reviewers can audit the source, threat model (docs/SECURITY.md), and network diagram on this page. Your compliance posture depends on how you deploy and operate it.",
  },
] as const;

export const TEAMS_CONTACT_EMAIL = "studio-vault@starvsk.dev";
