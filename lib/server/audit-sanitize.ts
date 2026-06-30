const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /x-api-key/i,
  /authorization/i,
  /bearer\s+/i,
  /secret/i,
  /password/i,
];

/** Sanitize Roblox error text — never echo secrets or huge payloads. */
export function sanitizeAuditError(message: string | undefined): string | undefined {
  if (!message) {
    return undefined;
  }

  let sanitized = message.replace(/\s+/g, " ").trim();
  if (SECRET_PATTERNS.some((pattern) => pattern.test(sanitized))) {
    return "Roblox API error (redacted)";
  }

  if (sanitized.length > 240) {
    sanitized = `${sanitized.slice(0, 240)}…`;
  }

  return sanitized;
}
