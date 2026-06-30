import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GET as healthGet } from "@/app/api/health/route";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
) as { version: string };

describe("GET /api/health", () => {
  it("returns ok and version with metrics snapshot", async () => {
    const response = await healthGet();
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      ok: boolean;
      version: string;
      metrics?: { uploadsSucceeded: number };
    };
    expect(body.ok).toBe(true);
    expect(body.version).toBe(packageJson.version);
    expect(body.metrics).toBeDefined();
    expect(typeof body.metrics?.uploadsSucceeded).toBe("number");
  });
});

describe("CLI config template", () => {
  it("studio-vault.json.example is valid JSON with profiles", () => {
    const example = JSON.parse(
      readFileSync(join(root, "studio-vault.json.example"), "utf8"),
    ) as { profiles: Record<string, unknown> };
    expect(Object.keys(example.profiles).length).toBeGreaterThan(0);
  });
});
