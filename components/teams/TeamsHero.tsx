"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { IconArrowRight, IconExternal } from "@/components/ui/Icon";
import { siteConfig } from "@/lib/seo/site";
import { docsUrl } from "@/lib/teams/content";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function TeamsHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-[var(--border-subtle)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, var(--accent-muted), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={fadeUp}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <p className="label mb-4">Teams &amp; self-hosting</p>
          <h1 className="font-display text-balance text-[2rem] font-medium leading-[1.12] tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-[2.75rem]">
            Self-hosted Roblox asset pipeline your studio controls.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            Bulk Open Cloud uploads, local libraries, model package updates, and InsertService
            scripts — deployed on your infrastructure. No multi-tenant SaaS. No vendor holding your
            API keys.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={docsUrl("DEPLOYMENT.md")} className="btn-primary px-5 py-2.5 text-[15px]">
              View deploy guide
              <IconExternal size={15} />
            </a>
            <Link href="/workspace" className="btn-secondary px-5 py-2.5 text-[15px]">
              Open workspace
              <IconArrowRight size={16} />
            </Link>
            <a
              href={siteConfig.links.github}
              className="btn-ghost px-5 py-2.5 text-[15px]"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>

          <p className="mt-6 font-mono text-xs text-[var(--text-faint)]">
            MIT · Docker-ready · Optional audit logs · Roblox Open Cloud only
          </p>
        </motion.div>
      </div>
    </section>
  );
}
