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
  const regex = /(\$\$[\s\S]*?\Detail\$\$|\$[^$\n]+?\$|\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Let's use a simpler regex that doesn't capture wrong math blocks
  const simpleRegex = /(\$[^$\n]+?\$|\*\*[^[**\n]]+?\*\*|`[^`\n]+?`)/g;
  
  let idx = 0;
  while (idx < text.length) {
    const char = text[idx];
    
    // Check for double dollar block/inline math $$...$$
    if (char === "$" && text[idx + 1] === "$") {
      const nextIndex = text.indexOf("$$", idx + 2);
      if (nextIndex !== -1 && nextIndex > idx + 2) {
        tokens.push({ kind: "math-inline", content: text.slice(idx + 2, nextIndex) });
        idx = nextIndex + 2;
        continue;
      }
    }
    
    // Check for single dollar inline math $...$
    if (char === "$") {
      const nextIndex = text.indexOf("$", idx + 1);
      if (nextIndex !== -1 && nextIndex > idx + 1) {
        tokens.push({ kind: "math-inline", content: text.slice(idx + 1, nextIndex) });
        idx = nextIndex + 1;
        continue;
      }
    }
    
    // Check for bold **...**
    if (char === "*" && text[idx + 1] === "*") {
      const nextIndex = text.indexOf("**", idx + 2);
      if (nextIndex !== -1 && nextIndex > idx + 2) {
        tokens.push({ kind: "bold", content: text.slice(idx + 2, nextIndex) });
        idx = nextIndex + 2;
        continue;
      }
    }
    
    // Check for code `...`
    if (char === "`") {
      const nextIndex = text.indexOf("`", idx + 1);
      if (nextIndex !== -1 && nextIndex > idx + 1) {
        tokens.push({ kind: "code", content: text.slice(idx + 1, nextIndex) });
        idx = nextIndex + 1;
        continue;
      }
    }

    // Accumulate plain text character by character or in blocks
    let plainText = "";
    while (idx < text.length && text[idx] !== "$" && !(text[idx] === "*" && text[idx+1] === "*") && text[idx] !== "`") {
      plainText += text[idx];
      idx++;
    }
    if (plainText) {
      tokens.push({ kind: "text", content: plainText });
    }
  }

  return tokens;
}

/** Render inline tokens into React nodes, all staying in one line flow. */
function renderInline(tokens: InlineToken[]): React.ReactNode {
  return tokens.map((t, i) => {
    switch (t.kind) {
      case "text":    return <span key={i}>{t.content}</span>;
      case "bold":    return <strong key={i} className="text-cyan-300 font-extrabold">{t.content}</strong>;
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
  | { type: "mixed-list"; items: { prefix: string; tokens: InlineToken[] }[] }
  | { type: "flow-process"; steps: string[] }
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

    // Callout check: matches either `> [!KEY]` or `[!KEY]` (with or without brackets/spaces/quotes)
    const calloutHeader = trimmed.match(/^(?:>\s*)?\[!(NOTE|FORMULA|KEY|WARN|WARNING)\]/i);
    if (calloutHeader) {
      const kind = calloutHeader[1].toLowerCase() as "note" | "formula" | "key" | "warn";
      
      // Accumulate callout body text
      let bodyLines: string[] = [];
      const restOfLine = trimmed.replace(/^(?:>\s*)?\[!(NOTE|FORMULA|KEY|WARN|WARNING)\]/i, "").trim();
      if (restOfLine) {
        bodyLines.push(restOfLine);
      }
      
      i++;
      // Gather lines until we hit another distinct block boundary
      while (i < lines.length) {
        const nextLine = lines[i];
        const nextTrimmed = nextLine.trim();
        
        if (nextTrimmed === "" || 
            /^(?:>\s*)?\[!(NOTE|FORMULA|KEY|WARN|WARNING)\]/i.test(nextTrimmed) || 
            /^---+$/.test(nextTrimmed) ||
            /^(Role|Step|Phase|Scenario|Section)\s+\d+:/i.test(nextTrimmed)) {
          break;
        }
        
        bodyLines.push(nextLine.replace(/^>\s?/, ""));
        i++;
      }
      
      blocks.push({
        type: "callout",
        kind: kind === "warning" ? "warn" : kind,
        title: kind.toUpperCase(),
        tokens: parseInlineTokens(bodyLines.join(" ").trim()),
      });
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

    // Role / Step / Phase headings (e.g. "Role 1: ...")
    const roleHeading = trimmed.match(/^(Role|Step|Phase|Scenario|Section)\s+\d+:\s*(.*)/i);
    if (roleHeading && trimmed.length < 90) {
      blocks.push({ type: "heading", level: 3, text: trimmed });
      i++;
      continue;
    }

    // Short bold lines as subheadings (e.g. "**Fabrication Flow:**")
    if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length < 60) {
      blocks.push({ type: "heading", level: 3, text: trimmed.slice(2, -2).replace(/:$/, "") });
      i++;
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

    // Numbered list (digits or letters, e.g. "1. ..." or "A. ...")
    if (/^(?:\d+|[A-Za-z])\.\s/.test(trimmed)) {
      const items: { prefix: string; tokens: InlineToken[] }[] = [];
      while (i < lines.length && /^(?:\d+|[A-Za-z])\.\s/.test(lines[i].trim())) {
        const itemTrimmed = lines[i].trim();
        const prefixMatch = itemTrimmed.match(/^([^\s]+)\s+(.*)/);
        if (prefixMatch) {
          items.push({
            prefix: prefixMatch[1],
            tokens: parseInlineTokens(prefixMatch[2])
          });
        }
        i++;
      }
      blocks.push({ type: "mixed-list", items });
      continue;
    }

    // Flow process line (e.g. "Silicon Wafer→Oxidation→Photolithography→...")
    if (trimmed.includes("→") || trimmed.includes("->")) {
      const steps = trimmed.split(/\s*(?:→|->)\s*/).filter(Boolean);
      if (steps.length > 1) {
        blocks.push({ type: "flow-process", steps });
        i++;
        continue;
      }
    }

    // Regular paragraph
    blocks.push({ type: "paragraph", tokens: parseInlineTokens(trimmed) });
    i++;
  }

  return blocks;
}

/* ─── RichContent Component ─── */
interface RichContentProps {
  content: string;
}

export function RichContent({ content }: RichContentProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-3.5 rich-content">
      {blocks.map((block, i) => {
        switch (block.type) {

          case "divider":
            return <hr key={i} className="border-white/10 my-4" />;

          case "heading":
            return block.level === 2 ? (
              <h2 key={i} className="text-[13px] font-black uppercase tracking-wider text-cyan-400 mt-6 mb-2 pb-1 border-b border-cyan-500/20">
                {block.text}
              </h2>
            ) : (
              <h3 key={i} className="text-xs font-black uppercase tracking-wider text-purple-400 mt-5 mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
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

          case "mixed-list":
            return (
              <ul key={i} className="space-y-2.5 ml-1 my-3.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
                    <span className="text-cyan-400 font-extrabold flex-shrink-0 min-w-[20px] bg-cyan-950/40 border border-cyan-500/25 px-1.5 py-0.5 rounded text-[10px] text-center shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                      {item.prefix}
                    </span>
                    <span className="mt-0.5">{renderInline(item.tokens)}</span>
                  </li>
                ))}
              </ul>
            );

          case "flow-process":
            return (
              <div key={i} className="my-5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-cyan-500/10">
                <div className="flex items-center gap-3 min-w-max p-1.5">
                  {block.steps.map((step, j) => (
                    <React.Fragment key={j}>
                      <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 text-cyan-300 font-black tracking-wide text-[11px] shadow-[0_0_15px_rgba(6,182,212,0.06)] backdrop-blur-sm hover:border-cyan-500/40 transition-colors">
                        {step}
                      </div>
                      {j < block.steps.length - 1 && (
                        <span className="text-cyan-500/40 font-bold text-xs animate-pulse">➔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );

          case "callout": {
            const calloutStyles = {
              note:    { border: "border-blue-500/30",    bg: "bg-blue-500/5",    icon: "💡", label: "Note",        labelColor: "text-blue-400" },
              formula: { border: "border-amber-500/30",   bg: "bg-amber-500/5",   icon: "🧮", label: "Key Formula", labelColor: "text-amber-400" },
              key:     { border: "border-emerald-500/30", bg: "bg-emerald-500/5", icon: "🔑", label: "Key Concept", labelColor: "text-emerald-400" },
              warn:    { border: "border-red-500/30",     bg: "bg-red-500/5",     icon: "⚠️", label: "Warning",     labelColor: "text-red-400" },
            }[block.kind];

            return (
              <div key={i} className={`rounded-xl border ${calloutStyles.border} ${calloutStyles.bg} px-6 py-5 my-5 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.01)]`}>
                <div className={`text-[10px] font-black uppercase tracking-widest ${calloutStyles.labelColor} mb-3 flex items-center gap-2 border-b border-white/5 pb-2`}>
                  <span>{calloutStyles.icon}</span>
                  {calloutStyles.label}
                </div>
                <div className="text-sm text-slate-300 leading-relaxed px-1">
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
