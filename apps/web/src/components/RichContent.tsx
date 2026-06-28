"use client";

import React, { useEffect, useRef, useState } from "react";
import katex from "katex";

/* ─── KaTeX Block Math Renderer ─── */
interface MathProps {
  formula: string;
  block?: boolean;
}

function Math({ formula, block = false }: MathProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(formula.trim(), ref.current, {
        throwOnError: false,
        displayMode: block,
        output: "html",
        strict: false,
      });
    } catch {
      if (ref.current) ref.current.textContent = formula;
    }
  }, [formula, block]);

  return block ? (
    <div className="my-4 overflow-x-auto">
      <div
        className="flex justify-center py-4 px-4 rounded-xl bg-slate-900/60 border border-white/5"
        ref={ref as React.RefObject<HTMLDivElement>}
      />
    </div>
  ) : (
    <span ref={ref} className="katex-inline mx-0.5 align-middle" />
  );
}

/* ─── Inline token types ─── */
type InlineToken =
  | { kind: "text"; content: string }
  | { kind: "bold"; content: string }
  | { kind: "italic"; content: string }
  | { kind: "code"; content: string }
  | { kind: "math-inline"; content: string };

/** Parse a single line's inline tokens (text, bold, code, inline math). */
function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  // Order matters: $$...$$ first, then $...$, **bold**, *italic*, `code`
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: "text", content: text.slice(lastIndex, match.index) });
    }
    const t = match[0];
    if (t.startsWith("$$")) {
      // Block math appearing inline in text — treat as inline
      tokens.push({ kind: "math-inline", content: t.slice(2, -2) });
    } else if (t.startsWith("$")) {
      tokens.push({ kind: "math-inline", content: t.slice(1, -1) });
    } else if (t.startsWith("**")) {
      tokens.push({ kind: "bold", content: t.slice(2, -2) });
    } else if (t.startsWith("*")) {
      tokens.push({ kind: "italic", content: t.slice(1, -1) });
    } else if (t.startsWith("`")) {
      tokens.push({ kind: "code", content: t.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ kind: "text", content: text.slice(lastIndex) });
  }
  return tokens;
}

/** Render inline tokens into React nodes, all staying in one line flow. */
function renderInline(tokens: InlineToken[]): React.ReactNode {
  return tokens.map((t, i) => {
    switch (t.kind) {
      case "text":    return <span key={i}>{t.content}</span>;
      case "bold":    return <strong key={i} className="text-cyan-300 font-black">{t.content}</strong>;
      case "italic":  return <em key={i} className="text-slate-300 italic">{t.content}</em>;
      case "code":    return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] border border-emerald-900/40">{t.content}</code>;
      case "math-inline": return <Math key={i} formula={t.content} block={false} />;
    }
  });
}

/* ─── Block-level segment types ─── */
type BlockSegment =
  | { type: "paragraph"; tokens: InlineToken[] }
  | { type: "math-block"; content: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "bullet"; items: InlineToken[][] }
  | { type: "numbered"; items: InlineToken[][] }
  | { type: "divider" }
  | { type: "callout"; kind: "note" | "formula" | "key" | "warn"; title: string; tokens: InlineToken[] };

/** Parse full content into block-level segments. */
function parseBlocks(raw: string): BlockSegment[] {
  const blocks: BlockSegment[] = [];
  const lines = raw.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip blank lines
    if (trimmed === "") { i++; continue; }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    // Block math  $$  (multi-line)
    if (trimmed.startsWith("$$")) {
      let math = trimmed.slice(2);
      if (math.endsWith("$$")) {
        blocks.push({ type: "math-block", content: math.slice(0, -2).trim() });
        i++;
        continue;
      }
      i++;
      while (i < lines.length && !lines[i].trim().endsWith("$$")) {
        math += "\n" + lines[i];
        i++;
      }
      if (i < lines.length) {
        math += "\n" + lines[i].trim().slice(0, -2);
        i++;
      }
      blocks.push({ type: "math-block", content: math.trim() });
      continue;
    }

    // Heading ##
    const h2 = trimmed.match(/^##\s+(.*)/);
    if (h2) {
      blocks.push({ type: "heading", level: 2, text: h2[1] });
      i++;
      continue;
    }

    // Heading ###
    const h3 = trimmed.match(/^###\s+(.*)/);
    if (h3) {
      blocks.push({ type: "heading", level: 3, text: h3[1] });
      i++;
      continue;
    }

    // Callout  > [!TYPE]
    const calloutMatch = trimmed.match(/^>\s*\[!(NOTE|FORMULA|KEY|WARN|WARNING)\]\s*(.*)/i);
    if (calloutMatch) {
      const kindMap: Record<string, "note" | "formula" | "key" | "warn"> = {
        NOTE: "note", FORMULA: "formula", KEY: "key", WARN: "warn", WARNING: "warn",
      };
      let body = calloutMatch[2];
      i++;
      while (i < lines.length && (lines[i].startsWith("> ") || lines[i].startsWith(">"))) {
        body += "\n" + lines[i].replace(/^>\s?/, "");
        i++;
      }
      blocks.push({
        type: "callout",
        kind: kindMap[calloutMatch[1].toUpperCase()],
        title: calloutMatch[1].toUpperCase(),
        tokens: parseInlineTokens(body.trim()),
      });
      continue;
    }

    // Bullet list  - or * or •
    if (/^[-*•]\s/.test(trimmed)) {
      const items: InlineToken[][] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        items.push(parseInlineTokens(lines[i].trim().replace(/^[-*•]\s/, "")));
        i++;
      }
      blocks.push({ type: "bullet", items });
      continue;
    }

    // Numbered list  1. 2. etc.
    if (/^\d+\.\s/.test(trimmed)) {
      const items: InlineToken[][] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(parseInlineTokens(lines[i].trim().replace(/^\d+\.\s/, "")));
        i++;
      }
      blocks.push({ type: "numbered", items });
      continue;
    }

    // Regular paragraph  — all inline elements stay IN the same <p>
    blocks.push({ type: "paragraph", tokens: parseInlineTokens(trimmed) });
    i++;
  }

  return blocks;
}

/* ─── RichContent Renderer ─── */
interface RichContentProps {
  content: string;
}

export function RichContent({ content }: RichContentProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2.5 rich-content">
      {blocks.map((block, i) => {
        switch (block.type) {

          case "divider":
            return <hr key={i} className="border-white/10 my-4" />;

          case "heading":
            return block.level === 2 ? (
              <h2 key={i} className="text-sm font-black uppercase tracking-widest text-cyan-400 mt-5 mb-2 pb-1 border-b border-cyan-500/20">
                {block.text}
              </h2>
            ) : (
              <h3 key={i} className="text-xs font-black uppercase tracking-wider text-purple-400 mt-4 mb-1">
                {block.text}
              </h3>
            );

          case "math-block":
            return <Math key={i} formula={block.content} block />;

          case "paragraph":
            return (
              <p key={i} className="text-sm leading-relaxed text-slate-300">
                {renderInline(block.tokens)}
              </p>
            );

          case "bullet":
            return (
              <ul key={i} className="space-y-2 ml-1">
                {block.items.map((itemTokens, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
                    <span className="text-cyan-500 mt-0.5 flex-shrink-0 font-bold">›</span>
                    <span>{renderInline(itemTokens)}</span>
                  </li>
                ))}
              </ul>
            );

          case "numbered":
            return (
              <ol key={i} className="space-y-2 ml-1">
                {block.items.map((itemTokens, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
                    <span className="text-cyan-500 mt-0.5 flex-shrink-0 font-bold w-4 text-right">{j + 1}.</span>
                    <span>{renderInline(itemTokens)}</span>
                  </li>
                ))}
              </ol>
            );

          case "callout": {
            const calloutStyles = {
              note:    { border: "border-blue-500/30",    bg: "bg-blue-500/5",    icon: "💡", label: "Note",        labelColor: "text-blue-400" },
              formula: { border: "border-amber-500/30",   bg: "bg-amber-500/5",   icon: "🧮", label: "Key Formula", labelColor: "text-amber-400" },
              key:     { border: "border-emerald-500/30", bg: "bg-emerald-500/5", icon: "🔑", label: "Key Concept", labelColor: "text-emerald-400" },
              warn:    { border: "border-red-500/30",     bg: "bg-red-500/5",     icon: "⚠️", label: "Warning",     labelColor: "text-red-400" },
            }[block.kind];

            return (
              <div key={i} className={`rounded-xl border ${calloutStyles.border} ${calloutStyles.bg} px-4 py-3 my-2`}>
                <div className={`text-[10px] font-black uppercase tracking-widest ${calloutStyles.labelColor} mb-1.5 flex items-center gap-1.5`}>
                  <span>{calloutStyles.icon}</span>
                  {calloutStyles.label}
                </div>
                <div className="text-sm text-slate-300 leading-relaxed">
                  {renderInline(block.tokens)}
                </div>
              </div>
            );
          }
        }
      })}
    </div>
  );
}
