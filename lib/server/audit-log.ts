import { appendFile } from "node:fs/promises";
import { isAuditLogEnabled, getAuditLogPath } from "@/lib/server/config";

export { sanitizeAuditError } from "@/lib/server/audit-sanitize";

export type AuditEventType = "asset.create" | "asset.patch";
export type AuditStatus = "success" | "failure";

export interface AuditLogEntry {
  ts: string;
  event: AuditEventType;
  actor?: string;
  creatorId: string;
  creatorType: "user" | "group";
  assetId?: string;
  displayName: string;
  fileName: string;
  assetType: string;
  status: AuditStatus;
  error?: string;
  durationMs: number;
  requestId: string;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  if (!isAuditLogEnabled()) {
    return;
  }

  const line = `${JSON.stringify(entry)}\n`;
  const filePath = getAuditLogPath();

  if (filePath) {
    await appendFile(filePath, line, "utf8");
  } else {
    process.stdout.write(line);
  }
}
