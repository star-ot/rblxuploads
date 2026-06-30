"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { IconCheck, IconCopy } from "@/components/ui/Icon";

const codeTheme: Record<string, CSSProperties> = {
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

export type CodePreviewLanguage = "bash" | "nginx" | "docker" | "json" | "yaml";

interface CodePreviewProps {
  code: string;
  language?: CodePreviewLanguage;
  filename?: string;
  className?: string;
  copyable?: boolean;
}

export function CodePreview({
  code,
  language = "bash",
  filename,
  className = "",
  copyable = true,
}: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [code]);

  return (
    <div
      className={[
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]",
        className,
      ].join(" ")}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-inset)] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {filename ? (
            <span className="truncate font-mono text-[10px] text-[var(--text-secondary)]">
              {filename}
            </span>
          ) : (
            <span className="font-mono text-[10px] text-[var(--text-faint)]">{language}</span>
          )}
        </div>
        {copyable ? (
          <button
            type="button"
            onClick={onCopy}
            className="btn-ghost flex shrink-0 items-center gap-1 px-2 py-1 text-[11px]"
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>
      <div className="min-h-0 overflow-x-auto p-1">
        <SyntaxHighlighter
          language={language === "nginx" ? "nginx" : language}
          style={codeTheme}
          wrapLongLines
          customStyle={{
            margin: 0,
            padding: "0.75rem 0.5rem",
            background: "transparent",
            fontSize: "11px",
            lineHeight: 1.55,
          }}
          codeTagProps={{
            style: { fontFamily: "var(--font-mono)" },
          }}
          PreTag="div"
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
