"use client";
/* eslint-disable @next/next/no-img-element */

import type { UploadQueueItem } from "@/lib/types";

interface ResultsTableProps {
  items: UploadQueueItem[];
}

export function ResultsTable({ items }: ResultsTableProps) {
  const finished = items.filter(
    (item) => item.status === "complete" || item.status === "failed",
  );

  const completed = finished.filter((item) => item.status === "complete");
  const completedWithIds = completed.filter(
    (item): item is UploadQueueItem & { assetId: string } => Boolean(item.assetId),
  );

  async function copyOne(assetId: string | undefined) {
    if (!assetId) {
      return;
    }

    await navigator.clipboard.writeText(`rbxassetid://${assetId}`);
  }

  async function copyAll() {
    if (!completedWithIds.length) {
      return;
    }

    const text = completedWithIds
      .map((item) => `${item.assetName}: rbxassetid://${item.assetId}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
  }

  function exportJson() {
    const payload = finished.map((item) => ({
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
    anchor.download = `rblxuploads-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-[var(--text-primary)]">Output</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {completed.length} succeeded · {finished.length - completed.length} failed
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyAll}
            disabled={!completedWithIds.length}
            className="btn-secondary"
          >
            Copy all IDs
          </button>
          <button
            type="button"
            onClick={exportJson}
            disabled={!finished.length}
            className="btn-secondary"
          >
            Export JSON
          </button>
        </div>
      </div>

      {finished.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-inset)] p-8 text-center text-sm text-[var(--text-muted)]">
          Finished uploads land here with copyable asset IDs.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-3 py-2 font-medium">Thumb</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">State</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {finished.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] last:border-0"
                >
                  <td className="px-3 py-2.5">
                    <img
                      src={item.previewUrl}
                      alt={item.assetName}
                      className="h-9 w-9 rounded border border-[var(--border)] object-cover"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-[var(--text-primary)]">{item.assetName}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {item.assetId ? `rbxassetid://${item.assetId}` : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    {item.status === "complete" ? (
                      <span className="status-chip status-complete">Done</span>
                    ) : (
                      <span className="status-chip status-failed">Failed</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => copyOne(item.assetId)}
                      disabled={!item.assetId}
                      className="btn-secondary px-2 py-1 text-xs"
                    >
                      Copy
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
