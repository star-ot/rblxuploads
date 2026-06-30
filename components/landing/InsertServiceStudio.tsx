"use client";

import { useMemo, useState } from "react";
import { LuaCodePreview } from "@/components/ui/LuaCodePreview";
import { IconArrowRight, IconAudio, IconCopy, IconModel } from "@/components/ui/Icon";
import {
  buildInsertServiceScript,
  DEFAULT_INSERT_SCRIPT_OPTIONS,
  type InsertScriptAsset,
} from "@/lib/insert-service-script";
import Link from "next/link";

const DEMO_PACKAGES: InsertScriptAsset[] = [
  { name: "Env_TreeCluster", assetId: "6612049381", type: "Model" },
  { name: "SFX_ClickSoft", assetId: "9123847102", type: "Audio" },
  { name: "Char_HeroMesh", assetId: "7729103845", type: "Mesh" },
];

export function InsertServiceStudio() {
  const [copied, setCopied] = useState(false);
  const script = useMemo(
    () =>
      buildInsertServiceScript(DEMO_PACKAGES, {
        ...DEFAULT_INSERT_SCRIPT_OPTIONS,
        layout: "grid",
        gridColumns: 3,
        spacing: 20,
      }),
    [],
  );

  async function copyDemo() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section id="studio-loader" className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="max-w-lg">
            <p className="label mb-3">Upload → Workspace</p>
            <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
              From Open Cloud to Studio in one paste.
            </h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Select packages or audio in your library — or fresh uploads in Results — and generate
              production-ready Luau. Models load via{" "}
              <span className="font-mono text-[var(--text-primary)]">InsertService</span>; sounds
              become <span className="font-mono text-[var(--text-primary)]">Sound</span> instances
              with configured <span className="font-mono text-[var(--text-primary)]">SoundId</span>{" "}
              values.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-[var(--text-muted)]">
              <li className="flex gap-2">
                <IconModel size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                <span>
                  <strong className="font-medium text-[var(--text-secondary)]">Packages</strong> —
                  batch InsertService load with grid or line layout
                </span>
              </li>
              <li className="flex gap-2">
                <IconAudio size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                <span>
                  <strong className="font-medium text-[var(--text-secondary)]">Sounds</strong> —
                  rbxassetid SoundId, volume, loop, and play-on-insert
                </span>
              </li>
              <li className="flex gap-2">
                <IconModel size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                <span>
                  <strong className="font-medium text-[var(--text-secondary)]">Three formats</strong> —
                  ServerScript, ModuleScript, or Command Bar one-liner
                </span>
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/workspace" className="btn-primary px-5 py-2.5">
                Try in workspace
                <IconArrowRight size={16} />
              </Link>
              <button type="button" className="btn-secondary px-5 py-2.5" onClick={copyDemo}>
                <IconCopy size={14} />
                {copied ? "Copied demo" : "Copy demo script"}
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-4 rounded-3xl opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, var(--accent-muted), transparent 70%)",
              }}
              aria-hidden
            />
            <div className="relative space-y-3">
              <div className="flex flex-wrap gap-2">
                {DEMO_PACKAGES.map((pkg) => (
                  <span
                    key={pkg.assetId}
                    className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-1 font-mono text-[10px] text-[var(--text-secondary)]"
                  >
                    {pkg.name}
                  </span>
                ))}
              </div>
              <LuaCodePreview
                code={script}
                filename="StudioVault_Load_batch_3.lua"
                maxHeight="min(22rem, 45vh)"
              />
              <p className="text-center font-mono text-[10px] text-[var(--text-faint)]">
                Live preview · edit options in the workspace library
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
