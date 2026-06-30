"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  IconGrid,
  IconModel,
  IconSettings,
  IconTerminal,
  IconUpload,
} from "@/components/ui/Icon";
import { TEAMS_WHY_ITEMS } from "@/lib/teams/content";

const ICONS = [IconUpload, IconModel, IconTerminal, IconSettings, IconGrid] as const;

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function TeamsWhyStudios() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="why-studios"
      aria-labelledby="why-studios-heading"
      className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 max-w-lg">
          <p className="label mb-3">Why studios choose Studio Vault</p>
          <h2
            id="why-studios-heading"
            className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl"
          >
            Pipeline tooling you can audit — not rent.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
            Same local-first workflow solo developers love — packaged for security review and team
            operations.
          </p>
        </div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={container}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
        >
          {TEAMS_WHY_ITEMS.map((entry, index) => {
            const Icon = ICONS[index] ?? IconUpload;
            return (
              <motion.article
                key={entry.title}
                variants={item}
                transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="surface-interactive rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]">
                  <Icon size={18} />
                </div>
                <h3 className="font-display text-base font-medium text-[var(--text-primary)]">
                  {entry.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {entry.description}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
