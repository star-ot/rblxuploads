"use client";

import type { CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const heroLuaTheme: Record<string, CSSProperties> = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: "transparent",
    margin: 0,
  },
  comment: { color: "#6b7280", fontStyle: "italic" },
  string: { color: "#4ade80" },
  function: { color: "#60a5fa" },
  keyword: { color: "#c084fc" },
  builtin: { color: "#f472b6" },
};

interface HeroLuaSnippetProps {
  code: string;
  visibleChars?: number;
  className?: string;
}

export function HeroLuaSnippet({ code, visibleChars, className = "" }: HeroLuaSnippetProps) {
  const displayCode =
    visibleChars === undefined ? code : code.slice(0, Math.max(0, visibleChars));

  return (
    <div
      className={[
        "hero-lua-panel rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]",
        className,
      ].join(" ")}
    >
      <div className="hero-step-header flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-inset)] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[10px] text-[var(--text-faint)]">ModuleScript</span>
          <span className="truncate rounded bg-[var(--accent-muted)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--accent-hover)]">
            Assets.lua
          </span>
        </div>
        <span className="shrink-0 font-mono text-[9px] text-[var(--success-text)]">Luau</span>
      </div>
      <div className="hero-lua-scroll p-1">
        <SyntaxHighlighter
          language="lua"
          style={heroLuaTheme}
          showLineNumbers
          wrapLongLines={false}
          lineNumberStyle={{
            minWidth: "1.75em",
            paddingRight: "0.75em",
            color: "var(--text-faint)",
            userSelect: "none",
            fontSize: "9px",
          }}
          customStyle={{
            margin: 0,
            padding: "0.625rem 0.5rem",
            background: "transparent",
            fontSize: "10px",
            lineHeight: 1.55,
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono)",
            },
          }}
          PreTag="div"
        >
          {displayCode}
        </SyntaxHighlighter>
        {visibleChars !== undefined && visibleChars < code.length ? (
          <span className="hero-lua-cursor ml-2 inline-block h-3 w-0.5 bg-[var(--accent)]" aria-hidden />
        ) : null}
      </div>
    </div>
  );
}
