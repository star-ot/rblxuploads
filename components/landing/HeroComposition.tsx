"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconAudio, IconCopy, IconModel } from "@/components/ui/Icon";
import { HeroLuaSnippet } from "@/components/landing/HeroLuaSnippet";
import { createDemoImageThumbnail, createDemoThumbnail } from "@/lib/demo-placeholders";
import { buildCopyAllText, buildHeroLuaModule } from "@/lib/hero-lua-snippet";
import type { AssetType, UploadStatus } from "@/lib/types";

type HeroItem = {
  id: string;
  fileName: string;
  assetName: string;
  assetType: AssetType;
  assetId: string;
  thumbnail: string;
};

type HeroStep = "queue" | "results" | "lua";

const HERO_ITEMS: HeroItem[] = [
  {
    id: "h1",
    fileName: "icon_home.png",
    assetName: "UI_IconHome",
    assetType: "Image",
    assetId: "18472930102",
    thumbnail: createDemoImageThumbnail("home", 210),
  },
  {
    id: "h2",
    fileName: "sfx_click.ogg",
    assetName: "SFX_ClickSoft",
    assetType: "Audio",
    assetId: "9123847102",
    thumbnail: createDemoThumbnail("Audio", 0),
  },
  {
    id: "h3",
    fileName: "char_mesh.fbx",
    assetName: "Char_HeroMesh",
    assetType: "Mesh",
    assetId: "7729103845",
    thumbnail: createDemoThumbnail("Mesh", 1),
  },
];

const STATUS_LABELS: Record<UploadStatus, string> = {
  waiting: "Queued",
  uploading: "Sending",
  processing: "Roblox",
  complete: "Done",
  failed: "Error",
};

const STATUS_CLASS: Record<UploadStatus, string> = {
  waiting: "status-waiting",
  uploading: "status-uploading",
  processing: "status-processing",
  complete: "status-complete",
  failed: "status-failed",
};

type ItemState = {
  status: UploadStatus;
  progress: number;
};

const CYCLE_MS = 12_000;
const TICK_MS = 80;

const QUEUE_END_MS = 2_700;
const RESULTS_END_MS = 5_600;
const COPY_BUTTON_AT_MS = 3_100;
const COPY_PRESS_START_MS = 4_600;
const COPY_PRESS_END_MS = 5_300;
const LUA_START_MS = RESULTS_END_MS;

const STEP_TRANSITION = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1] as const,
};

function getItemStates(elapsed: number): ItemState[] {
  const t = elapsed % CYCLE_MS;

  if (t < 200) {
    return [
      { status: "waiting", progress: 0 },
      { status: "waiting", progress: 0 },
      { status: "waiting", progress: 0 },
    ];
  }

  if (t < 750) {
    const p = Math.min(100, ((t - 200) / 550) * 100);
    return [
      { status: "uploading", progress: p },
      { status: "waiting", progress: 0 },
      { status: "waiting", progress: 0 },
    ];
  }

  if (t < 1_000) {
    const p = Math.min(100, ((t - 750) / 250) * 100);
    return [
      { status: "processing", progress: p },
      { status: "waiting", progress: 0 },
      { status: "waiting", progress: 0 },
    ];
  }

  if (t < 1_550) {
    const p = Math.min(100, ((t - 1_000) / 550) * 100);
    return [
      { status: "complete", progress: 100 },
      { status: "uploading", progress: p },
      { status: "waiting", progress: 0 },
    ];
  }

  if (t < 1_800) {
    const p = Math.min(100, ((t - 1_550) / 250) * 100);
    return [
      { status: "complete", progress: 100 },
      { status: "processing", progress: p },
      { status: "waiting", progress: 0 },
    ];
  }

  if (t < 2_350) {
    const p = Math.min(100, ((t - 1_800) / 550) * 100);
    return [
      { status: "complete", progress: 100 },
      { status: "complete", progress: 100 },
      { status: "uploading", progress: p },
    ];
  }

  if (t < 2_600) {
    const p = Math.min(100, ((t - 2_350) / 250) * 100);
    return [
      { status: "complete", progress: 100 },
      { status: "complete", progress: 100 },
      { status: "processing", progress: p },
    ];
  }

  return [
    { status: "complete", progress: 100 },
    { status: "complete", progress: 100 },
    { status: "complete", progress: 100 },
  ];
}

function getHeroStep(elapsed: number, reduceMotion: boolean): HeroStep {
  if (reduceMotion) {
    return "lua";
  }

  const t = elapsed % CYCLE_MS;
  if (t < QUEUE_END_MS) {
    return "queue";
  }
  if (t < RESULTS_END_MS) {
    return "results";
  }
  return "lua";
}

function Thumbnail({ item }: { item: HeroItem }) {
  if (item.assetType === "Image") {
    return (
      <img
        src={item.thumbnail}
        alt=""
        className="h-9 w-9 shrink-0 rounded-md border border-[var(--border-subtle)] object-cover sm:h-10 sm:w-10"
      />
    );
  }

  const Icon = item.assetType === "Audio" ? IconAudio : IconModel;

  return (
    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-[var(--border-subtle)] sm:h-10 sm:w-10">
      <img src={item.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 text-[var(--text-muted)]">
        <Icon size={14} />
      </div>
    </div>
  );
}

function StepShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="surface hero-step-shell rounded-xl p-3 shadow-[var(--shadow-md)] sm:p-4">
      <div className="hero-step-header">{header}</div>
      <div className="hero-step-body mt-3 flex min-h-0 flex-col">{children}</div>
    </div>
  );
}

export function HeroComposition() {
  const reduceMotion = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsed((value) => value + TICK_MS);
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  const cycleT = elapsed % CYCLE_MS;
  const step = getHeroStep(elapsed, Boolean(reduceMotion));

  const itemStates = useMemo(
    () =>
      reduceMotion
        ? ([
            { status: "complete", progress: 100 },
            { status: "complete", progress: 100 },
            { status: "complete", progress: 100 },
          ] as ItemState[])
        : getItemStates(elapsed),
    [elapsed, reduceMotion],
  );

  const completedCount = itemStates.filter((item) => item.status === "complete").length;
  const batchProgress = Math.round(
    itemStates.reduce((sum, item) => sum + item.progress, 0) / itemStates.length,
  );
  const isRunning = itemStates.some(
    (item) => item.status === "uploading" || item.status === "processing",
  );

  const showCopyButton = step === "results" && (reduceMotion || cycleT >= COPY_BUTTON_AT_MS);
  const copyPressed =
    step === "results" &&
    !reduceMotion &&
    cycleT >= COPY_PRESS_START_MS &&
    cycleT < COPY_PRESS_END_MS;
  const copyDone =
    step === "lua" ||
    (step === "results" && (reduceMotion || cycleT >= COPY_PRESS_END_MS));

  const luaCode = useMemo(() => buildHeroLuaModule(HERO_ITEMS), []);
  const copyAllPreview = useMemo(() => buildCopyAllText(HERO_ITEMS), []);
  const luaTypeChars =
    step === "lua" && !reduceMotion
      ? Math.min(luaCode.length, Math.floor((cycleT - LUA_START_MS) / 8))
      : undefined;

  return (
    <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
      <div className="hero-grid-bg absolute inset-0 -z-10" aria-hidden />

      <div className="hero-stage relative p-4 sm:p-6">
        <AnimatePresence mode="wait" initial={false}>
          {step === "queue" ? (
            <motion.div
              key="queue"
              className="hero-step-layer absolute inset-0 p-4 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={STEP_TRANSITION}
            >
              <StepShell
                header={
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${isRunning ? "hero-pulse-dot bg-[var(--accent)]" : "bg-[var(--text-faint)]"}`}
                        />
                        <span className="font-mono text-[10px] text-[var(--text-faint)]">
                          Upload queue
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[var(--text-faint)]">
                          {completedCount}/{HERO_ITEMS.length} complete
                        </span>
                        <span
                          className={`btn-primary pointer-events-none px-2.5 py-1 text-[10px] ${isRunning ? "opacity-90" : ""}`}
                        >
                          {isRunning ? "Uploading…" : "Start upload"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between font-mono text-[9px] text-[var(--text-faint)]">
                        <span>Batch progress</span>
                        <span>{batchProgress}%</span>
                      </div>
                      <div className="progress-track">
                        <motion.div
                          className={`progress-fill ${isRunning ? "progress-fill-animated" : ""}`}
                          animate={{ width: `${batchProgress}%` }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </>
                }
              >
                <div className="hero-step-scroll">
                  <div className="space-y-2 pr-1">
                    {HERO_ITEMS.map((item, index) => {
                      const state = itemStates[index];
                      const locked =
                        state.status === "uploading" || state.status === "processing";

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-inset)] p-2.5"
                        >
                          <div className="flex gap-2.5">
                            <Thumbnail item={item} />
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-1">
                                <span
                                  className={`status-chip text-[9px] ${STATUS_CLASS[state.status]}`}
                                >
                                  {STATUS_LABELS[state.status]}
                                </span>
                                <span className="status-chip status-waiting text-[9px]">
                                  {item.assetType}
                                </span>
                                <span className="truncate font-mono text-[9px] text-[var(--text-faint)]">
                                  {item.fileName}
                                </span>
                              </div>
                              <p className="truncate text-[11px] font-medium text-[var(--text-primary)]">
                                {item.assetName}
                              </p>
                              {locked || (state.progress > 0 && state.status !== "complete") ? (
                                <div className="space-y-0.5">
                                  <div className="progress-track">
                                    <motion.div
                                      className={`progress-fill ${locked ? "progress-fill-animated" : ""}`}
                                      animate={{ width: `${state.progress}%` }}
                                      transition={{ duration: 0.2, ease: "easeOut" }}
                                    />
                                  </div>
                                  <span className="font-mono text-[9px] text-[var(--text-faint)]">
                                    {Math.round(state.progress)}%
                                  </span>
                                </div>
                              ) : null}
                              {state.status === "complete" ? (
                                <p className="truncate font-mono text-[9px] text-[var(--success-text)]">
                                  rbxassetid://{item.assetId}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </StepShell>
            </motion.div>
          ) : null}

          {step === "results" ? (
            <motion.div
              key="results"
              className="hero-step-layer absolute inset-0 p-4 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={STEP_TRANSITION}
            >
              <StepShell
                header={
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-[var(--text-faint)]">Results</p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        {HERO_ITEMS.length} succeeded · saved to library · ready to copy
                      </p>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{
                        opacity: showCopyButton ? 1 : 0,
                        scale: copyPressed ? 0.96 : showCopyButton ? 1 : 0.92,
                      }}
                      transition={{ duration: 0.25 }}
                    >
                      <span
                        className={[
                          "btn-secondary pointer-events-none inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] transition-colors",
                          copyPressed ? "hero-copy-btn-pressed" : "",
                          copyDone ? "text-[var(--success-text)]" : "",
                        ].join(" ")}
                      >
                        <IconCopy size={12} />
                        {copyDone ? "Copied" : "Copy all IDs"}
                      </span>
                    </motion.div>
                  </div>
                }
              >
                <div className="hero-step-scroll">
                  <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
                    <table className="data-table min-w-full text-[11px]">
                      <thead>
                        <tr>
                          <th className="w-10" />
                          <th>Name</th>
                          <th className="hidden sm:table-cell">Asset ID</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {HERO_ITEMS.map((item, index) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.06, duration: 0.25 }}
                          >
                            <td>
                              <Thumbnail item={item} />
                            </td>
                            <td className="max-w-[7rem] truncate font-medium text-[var(--text-primary)] sm:max-w-none">
                              {item.assetName}
                            </td>
                            <td className="hidden max-w-[10rem] truncate font-mono text-[10px] text-[var(--success-text)] sm:table-cell">
                              rbxassetid://{item.assetId}
                            </td>
                            <td>
                              <span className="status-chip status-complete text-[9px]">Done</span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </StepShell>
            </motion.div>
          ) : null}

          {step === "lua" ? (
            <motion.div
              key="lua"
              className="hero-step-layer absolute inset-0 p-4 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={STEP_TRANSITION}
            >
              <StepShell
                header={
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-[var(--text-faint)]">
                        Pasted into Studio
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        Copy all IDs → require-ready Luau module
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-[var(--success-bg)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--success-text)]">
                      Copied
                    </span>
                  </div>
                }
              >
                <div className="hero-clipboard shrink-0 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-inset)] px-2.5 py-2">
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-[var(--text-faint)]">
                    Clipboard
                  </p>
                  <pre className="whitespace-pre font-mono text-[9px] leading-relaxed text-[var(--text-muted)]">
                    {copyAllPreview}
                  </pre>
                </div>

                <HeroLuaSnippet code={luaCode} visibleChars={luaTypeChars} className="min-h-0" />
              </StepShell>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
