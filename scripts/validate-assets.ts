import { validateDirectory, formatValidateReport } from "@/lib/policy/cli-validate";
import { DEFAULT_UPLOAD_POLICY } from "@/lib/policy/defaults";
import type { UploadPolicyConfig } from "@/lib/types";

function parseArgv(argv: string[]) {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i += 1;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

function buildPolicy(flags: Record<string, string | boolean>): UploadPolicyConfig {
  return {
    ...DEFAULT_UPLOAD_POLICY,
    enabled: true,
    blockOnViolation: flags.block !== false,
    namingPattern:
      String(flags.pattern || process.env.STUDIO_VAULT_NAME_PATTERN || DEFAULT_UPLOAD_POLICY.namingPattern),
    maxNameLength: Number(
      flags["max-name-length"] || process.env.STUDIO_VAULT_MAX_NAME_LENGTH || DEFAULT_UPLOAD_POLICY.maxNameLength,
    ),
    warnDuplicateNames: true,
    imageMaxWidth: flags["max-width"] ? Number(flags["max-width"]) : null,
    imageMaxHeight: flags["max-height"] ? Number(flags["max-height"]) : null,
    imageMinWidth: flags["min-width"] ? Number(flags["min-width"]) : null,
    imageMinHeight: flags["min-height"] ? Number(flags["min-height"]) : null,
  };
}

const { flags, positional } = parseArgv(process.argv.slice(2));
const dir = positional[0];

if (!dir) {
  console.error("Usage: validate-assets <dir> [--pattern <regex>] [--max-name-length <n>]");
  process.exit(2);
}

const result = validateDirectory(dir, buildPolicy(flags));
console.log(formatValidateReport(result));
process.exit(result.ok ? 0 : 1);
