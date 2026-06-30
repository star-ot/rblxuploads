"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { IconArrowRight, IconCheck } from "@/components/ui/Icon";
import { TEAMS_NEVER_LEAVES, TEAMS_SECURITY_NODES, docsUrl } from "@/lib/teams/content";

export function TeamsSecurityDiagram() {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>("browser");

  const activeNode = TEAMS_SECURITY_NODES.find((n) => n.id === activeId) ?? TEAMS_SECURITY_NODES[0];

  return (
    <section
      id="security"
      aria-labelledby="security-heading"
      className="border-b border-[var(--border-subtle)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 max-w-lg">
          <p className="label mb-3">Security architecture</p>
          <h2
            id="security-heading"
            className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl"
          >
            One egress path. Full transparency.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
            Browser → your Next.js proxy → Roblox Open Cloud. Nothing else.{" "}
            <a href={docsUrl("SECURITY.md")} className="link-accent">
              Read the threat model
            </a>
            .
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 sm:p-8"
            role="img"
            aria-label="Data flow diagram: developer browser to self-hosted proxy to Roblox Open Cloud"
          >
            <div className="flex flex-col items-stretch gap-2">
              {TEAMS_SECURITY_NODES.map((node, index) => (
                <div key={node.id} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    onMouseEnter={() => setActiveId(node.id)}
                    onFocus={() => setActiveId(node.id)}
                    className={[
                      "teams-diagram-node w-full rounded-xl border px-4 py-4 text-left transition-colors",
                      activeId === node.id
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)] shadow-[0_0_0_1px_var(--accent-muted)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]",
                    ].join(" ")}
                    aria-pressed={activeId === node.id}
                  >
                    <p className="font-display text-sm font-medium text-[var(--text-primary)]">
                      {node.label}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-[var(--text-faint)]">
                      {node.id === "browser" && "localhost / your domain"}
                      {node.id === "proxy" && "POST /api/upload"}
                      {node.id === "roblox" && "apis.roblox.com"}
                    </p>
                  </button>
                  {index < TEAMS_SECURITY_NODES.length - 1 ? (
                    <motion.div
                      className="flex flex-col items-center py-1 text-[var(--text-faint)]"
                      animate={reduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
                      transition={
                        reduceMotion
                          ? undefined
                          : { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }
                      aria-hidden
                    >
                      <IconArrowRight size={14} className="rotate-90" />
                    </motion.div>
                  ) : null}
                </div>
              ))}
            </div>

            <motion.p
              key={activeNode.id}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] px-4 py-3 text-sm text-[var(--text-secondary)]"
            >
              {activeNode.detail}
            </motion.p>
          </div>

          <div>
            <h3 className="font-display text-base font-medium text-[var(--text-primary)]">
              Never leaves your network
            </h3>
            <ul className="mt-4 space-y-3">
              {TEAMS_NEVER_LEAVES.map((line) => (
                <li key={line} className="flex gap-3 text-sm text-[var(--text-muted)]">
                  <IconCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-[var(--success-text)]"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5">
              <p className="label mb-2">During upload only</p>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                API keys travel per-request from the browser to your proxy, then to Roblox. They are
                not written to server disk, logged, or stored in a database. Optional audit logs
                record asset metadata — never secrets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
