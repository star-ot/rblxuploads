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
    anchor.download = `roblox-upload-results-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Results</h2>
          <p className="text-sm text-zinc-400">
            {completed.length} completed / {finished.length} finished
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyAll}
            disabled={!completedWithIds.length}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Copy Names + IDs
          </button>
          <button
            type="button"
            onClick={exportJson}
            disabled={!finished.length}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export JSON
          </button>
        </div>
      </div>

      {finished.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-6 text-center text-sm text-zinc-500">
          Completed and failed uploads will appear here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-zinc-400">
                <th className="px-3">Preview</th>
                <th className="px-3">Name</th>
                <th className="px-3">Asset ID</th>
                <th className="px-3">Status</th>
                <th className="px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {finished.map((item) => (
                <tr key={item.id} className="rounded-md bg-zinc-950/70 text-zinc-200">
                  <td className="px-3 py-2">
                    <img
                      src={item.previewUrl}
                      alt={item.assetName}
                      className="h-10 w-10 rounded border border-zinc-800 object-cover"
                    />
                  </td>
                  <td className="px-3 py-2">{item.assetName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-300">
                    {item.assetId ? `rbxassetid://${item.assetId}` : "-"}
                  </td>
                  <td className="px-3 py-2">
                    {item.status === "complete" ? (
                      <span className="rounded bg-emerald-600/80 px-2 py-0.5 text-xs text-emerald-50">
                        Completed
                      </span>
                    ) : (
                      <span className="rounded bg-rose-600/80 px-2 py-0.5 text-xs text-rose-50">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => copyOne(item.assetId)}
                      disabled={!item.assetId}
                      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Copy ID
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
