"use client";

import type { CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const luaTheme: Record<string, CSSProperties> = {
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

interface LuaCodePreviewProps {
  code: string;
  filename?: string;
  scriptKind?: string;
  className?: string;
  maxHeight?: string;
}

export function LuaCodePreview({
  code,
  filename = "Loader.server.lua",
  scriptKind = "Luau",
  className = "",
  maxHeight = "min(24rem, 50vh)",
}: LuaCodePreviewProps) {
  return (
    <div
      className={[
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]",
        className,
      ].join(" ")}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-inset)] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[10px] text-[var(--text-faint)]">Script</span>
          <span className="truncate rounded bg-[var(--accent-muted)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--accent-hover)]">
            {filename}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[9px] text-[var(--success-text)]">{scriptKind}</span>
      </div>
      <div className="min-h-0 overflow-auto p-1" style={{ maxHeight }}>
        <SyntaxHighlighter
          language="lua"
          style={luaTheme}
          showLineNumbers
          wrapLongLines
          lineNumberStyle={{
            minWidth: "1.75em",
            paddingRight: "0.75em",
            color: "var(--text-faint)",
            userSelect: "none",
            fontSize: "10px",
          }}
          customStyle={{
            margin: 0,
            padding: "0.75rem 0.5rem",
            background: "transparent",
            fontSize: "11px",
            lineHeight: 1.55,
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono)",
            },
          }}
          PreTag="div"
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
