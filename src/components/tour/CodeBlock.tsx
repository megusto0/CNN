import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CodeBlockProps = {
  code: string;
  language?: string;
  highlightLine?: number;
  notes?: string[];
};

export default function CodeBlock({ code, language = "text", highlightLine, notes = [] }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.trimEnd().split("\n");

  async function copyCode() {
    await navigator.clipboard.writeText(code.trimEnd());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1100);
  }

  return (
    <figure
      className="overflow-hidden rounded-md border"
      style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border-subtle)" }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-2 text-xs"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}
      >
        <span className="font-mono">{language}</span>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1 rounded-sm px-2 py-1"
          style={{ color: copied ? "var(--positive)" : "var(--text-secondary)" }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>
      <pre className="overflow-x-auto py-3 text-sm leading-relaxed">
        <code>
          {lines.map((line, index) => {
            const lineNo = index + 1;
            const active = highlightLine === lineNo;
            return (
              <span
                key={`${lineNo}-${line}`}
                className="group relative grid grid-cols-[3rem_1fr] px-3"
                style={{
                  borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                  background: active
                    ? "linear-gradient(90deg, rgba(124,155,255,0.12), transparent)"
                    : "transparent",
                }}
              >
                <span className="select-none pr-4 text-right font-mono" style={{ color: "var(--text-tertiary)" }}>
                  {lineNo}
                </span>
                <span className="whitespace-pre font-mono" style={{ color: "var(--text-primary)" }}>
                  {line || " "}
                </span>
                {notes[index] && (
                  <span
                    className="pointer-events-none absolute left-14 top-full z-10 hidden max-w-xs rounded-md border px-3 py-2 text-xs group-hover:block"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      borderColor: "var(--border-strong)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {notes[index]}
                  </span>
                )}
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}
