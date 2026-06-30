"use client";

import { motion, useReducedMotion } from "motion/react";
import { IconFolder, IconSettings, IconTerminal, IconUpload } from "@/components/ui/Icon";
import { TEAMS_WORKFLOW_ITEMS, docsUrl } from "@/lib/teams/content";

const WORKFLOW_ICONS = [IconFolder, IconSettings, IconTerminal, IconUpload] as const;

export function TeamsWorkflows() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="workflows"
      aria-labelledby="workflows-heading"
      className="border-b border-[var(--border-subtle)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 max-w-lg">
          <p className="label mb-3">Team workflows</p>
          <h2
            id="workflows-heading"
            className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl"
          >
            Collaborate without a cloud backend.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
            Git-backed library sync, profile conventions, and optional audit trails.{" "}
            <a href={docsUrl("TEAM-WORKFLOWS.md")} className="link-accent">
              Team workflow guide
            </a>
            .
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <motion.div
            className="grid gap-4 sm:grid-cols-2"
            initial={reduceMotion ? false : { opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 0.4 }}
          >
            {TEAMS_WORKFLOW_ITEMS.map((item, index) => {
              const Icon = WORKFLOW_ICONS[index] ?? IconFolder;
              return (
                <article
                  key={item.title}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5"
                >
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]">
                    <Icon size={16} />
                  </div>
                  <h3 className="font-display text-sm font-medium text-[var(--text-primary)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </motion.div>

          <motion.div
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 sm:p-6"
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.08 }}
            aria-label="Git-based library sync demonstration"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="label">Git sync flow</p>
              <span className="rounded bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[9px] text-[var(--accent-hover)]">
                library.manifest.json
              </span>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2.5">
                <span className="text-[var(--success-text)]">①</span>
                <span className="text-[var(--text-secondary)]">
                  Artist exports <span className="text-[var(--text-primary)]">library.json</span>
                </span>
              </div>
              <div className="flex justify-center text-[var(--text-faint)]" aria-hidden>
                ↓ git commit
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2.5">
                <span className="text-[var(--accent)]">②</span>
                <span className="text-[var(--text-secondary)]">
                  Repo stores canonical{" "}
                  <span className="text-[var(--text-primary)]">.studio-vault/manifest</span>
                </span>
              </div>
              <div className="flex justify-center text-[var(--text-faint)]" aria-hidden>
                ↓ git pull
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-[var(--accent-muted)] bg-[var(--accent-subtle)] px-3 py-2.5">
                <span className="text-[var(--accent-hover)]">③</span>
                <span className="text-[var(--text-secondary)]">
                  Teammate merges into local IndexedDB
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[var(--text-faint)]">
              No server database. No vendor sync. Your game repo is the source of truth for asset
              metadata.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
