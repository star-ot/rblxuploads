"use client";

import { motion, useReducedMotion } from "motion/react";
import { CodePreview } from "@/components/ui/CodePreview";
import { TEAMS_DEPLOY_OPTIONS, docsUrl } from "@/lib/teams/content";

export function TeamsDeployment() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="deployment"
      aria-labelledby="deployment-heading"
      className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 max-w-lg">
          <p className="label mb-3">Deployment options</p>
          <h2
            id="deployment-heading"
            className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl"
          >
            Run it where your policies allow.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
            Docker is the primary path. Full env var reference and reverse-proxy examples in{" "}
            <a href={docsUrl("DEPLOYMENT.md")} className="link-accent">
              docs/DEPLOYMENT.md
            </a>
            .
          </p>
        </div>

        <motion.div
          className="grid gap-6 lg:grid-cols-3"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {TEAMS_DEPLOY_OPTIONS.map((option) => (
            <article
              key={option.id}
              className="flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5"
            >
              <h3 className="font-display text-base font-medium text-[var(--text-primary)]">
                {option.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">{option.description}</p>
              <div className="mt-4">
                <CodePreview
                  code={option.snippet}
                  language={option.language}
                  filename={
                    option.id === "docker"
                      ? "deploy.sh"
                      : option.id === "npm"
                        ? "build.sh"
                        : "nginx.conf"
                  }
                />
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
