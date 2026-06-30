"use client";

import { IconCheck, IconX } from "@/components/ui/Icon";
import { TEAMS_COMPARISON, type ComparisonCell } from "@/lib/teams/content";

function CellValue({ value }: { value: ComparisonCell }) {
  if (value === "yes") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[var(--success-text)]">
        <IconCheck size={14} aria-hidden />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="text-[var(--warning-text)]" title="Partial">
        ◐
        <span className="sr-only">Partial</span>
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex items-center text-[var(--text-faint)]">
        <IconX size={14} aria-hidden />
        <span className="sr-only">No</span>
      </span>
    );
  }
  return <span className="text-sm text-[var(--text-secondary)]">{value}</span>;
}

export function TeamsComparison() {
  return (
    <section
      id="comparison"
      aria-labelledby="comparison-heading"
      className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 max-w-lg">
          <p className="label mb-3">Comparison</p>
          <h2
            id="comparison-heading"
            className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl"
          >
            Studio Vault vs alternatives
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Honest positioning for procurement and engineering leads.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
          <table className="data-table w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="text-left">Capability</th>
                <th className="text-center">Studio Vault</th>
                <th className="text-center">Creator Dashboard</th>
                <th className="text-center">Build in-house</th>
              </tr>
            </thead>
            <tbody>
              {TEAMS_COMPARISON.map((row) => (
                <tr key={row.feature}>
                  <td className="text-[var(--text-secondary)]">{row.feature}</td>
                  <td className="text-center">
                    <CellValue value={row.studioVault} />
                  </td>
                  <td className="text-center">
                    <CellValue value={row.creatorDashboard} />
                  </td>
                  <td className="text-center">
                    <CellValue value={row.buildInHouse} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-[var(--text-faint)]">
          ◐ = limited or manual workflow. Creator Dashboard excels at one-off publishing; Studio
          Vault targets daily pipeline work at studio scale.
        </p>
      </div>
    </section>
  );
}
