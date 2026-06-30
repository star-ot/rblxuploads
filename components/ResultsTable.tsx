"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type { UploadQueueItem } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { InsertServiceScriptTrigger } from "@/components/library/InsertServiceScriptGenerator";
import { IconAudio, IconCopy, IconImage, IconModel } from "@/components/ui/Icon";
import {
  type InsertScriptAsset,
  isInsertableStudioAsset,
} from "@/lib/insert-service-script";

interface ResultsTableProps {
  items: UploadQueueItem[];
}

export function ResultsTable({ items }: ResultsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const finished = items.filter(
    (item) => item.status === "complete" || item.status === "failed",
  );

  const completed = finished.filter((item) => item.status === "complete");
  const completedWithIds = completed.filter(
    (item): item is UploadQueueItem & { assetId: string } => Boolean(item.assetId),
  );

  const insertScriptAssets: InsertScriptAsset[] = completedWithIds
    .filter((item) => isInsertableStudioAsset(item.assetType))
    .map((item) => ({
      name: item.assetName,
      assetId: item.assetId,
      type: item.assetType,
    }));

  async function copyOne(assetId: string | undefined, itemId: string) {
    if (!assetId) {
      return;
    }

    await navigator.clipboard.writeText(`rbxassetid://${assetId}`);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function copyAll() {
    if (!completedWithIds.length) {
      return;
    }

    const text = completedWithIds
      .map(
        (item) => `[${item.assetType}] ${item.assetName}: rbxassetid://${item.assetId}`,
      )
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedId("all");
    setTimeout(() => setCopiedId(null), 1500);
  }

  function exportCsv() {
    if (!finished.length) {
      return;
    }

    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = [
      ["type", "name", "fileName", "status", "assetId", "assetUri", "error"],
      ...finished.map((item) => [
        item.assetType,
        item.assetName,
        item.fileName,
        item.status,
        item.assetId ?? "",
        item.assetId ? `rbxassetid://${item.assetId}` : "",
        item.error ?? "",
      ]),
    ];

    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `studio-vault-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    const payload = finished.map((item) => ({
      type: item.assetType,
      name: item.assetName,
      fileName: item.fileName,
      status: item.status,
      assetId: item.assetId ?? null,
      assetUri: item.assetId ? `rbxassetid://${item.assetId}` : null,
      error: item.error ?? null,
    }));

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `studio-vault-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel">
      <SectionHeader
        title="Results"
        description="Finished uploads with copyable asset IDs. Generate Studio scripts for models, meshes, and sounds — completed items save to your library automatically."
        meta={`${completed.length} succeeded · ${finished.length - completed.length} failed`}
        action={
          <>
            <InsertServiceScriptTrigger
              assets={insertScriptAssets}
              className="btn-secondary"
              label="Load in Studio"
            />
            <button
              type="button"
              onClick={copyAll}
              disabled={!completedWithIds.length}
              className="btn-secondary"
            >
              <IconCopy size={14} />
              {copiedId === "all" ? "Copied" : "Copy all IDs"}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!finished.length}
              className="btn-secondary"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={exportJson}
              disabled={!finished.length}
              className="btn-secondary"
            >
              JSON
            </button>
          </>
        }
      />

      {finished.length === 0 ? (
        <EmptyState
          icon={<IconCopy size={18} />}
          title="No results yet"
          description="Completed uploads will appear here with rbxassetid URIs ready to copy."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12" />
                <th>Type</th>
                <th>Name</th>
                <th>Asset ID</th>
                <th>Status</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {finished.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.assetType === "Image" ? (
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="h-8 w-8 rounded border border-[var(--border-subtle)] object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--surface-inset)] text-[var(--text-muted)]">
                        {item.assetType === "Audio" ? (
                          <IconAudio size={14} />
                        ) : item.assetType === "Model" || item.assetType === "Mesh" ? (
                          <IconModel size={14} />
                        ) : (
                          <IconImage size={14} />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="text-[var(--text-muted)]">{item.assetType}</td>
                  <td className="font-medium text-[var(--text-primary)]">{item.assetName}</td>
                  <td className="font-mono text-xs">
                    {item.assetId ? `rbxassetid://${item.assetId}` : "—"}
                  </td>
                  <td>
                    {item.status === "complete" ? (
                      <span className="status-chip status-complete">Done</span>
                    ) : (
                      <span className="status-chip status-failed">Failed</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => copyOne(item.assetId, item.id)}
                      disabled={!item.assetId}
                      className="btn-ghost p-1.5"
                      aria-label="Copy asset ID"
                    >
                      {copiedId === item.id ? (
                        <span className="text-[11px] text-[var(--success-text)]">✓</span>
                      ) : (
                        <IconCopy size={14} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
