"use client";

import React, { useEffect, useRef, useState } from "react";
import katex from "katex";

/* ─── KaTeX Math Renderer ─── */
interface MathProps {
  formula: string;
  block?: boolean;
}

function Math({ formula, block = false }: MathProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(formula.trim(), ref.current, {
        throwOnError: false,
        displayMode: block,
        output: "html",
        strict: false,
      });
      setError(null);
    } catch (e: any) {
      setError(formula);
    }
  }, [formula, block]);

  if (error) {
    return (
      <code className="px-1 py-0.5 rounded bg-slate-900 text-amber-400 font-mono text-xs">
        {error}
      </code>
    );
  }

  return block ? (
    <div className="my-4 overflow-x-auto">
      <div
        className="flex justify-center py-3 px-4 rounded-xl bg-slate-900/60 border border-white/5"
        ref={ref as React.RefObject<HTMLDivElement>}
      />
    </div>
  ) : (
    <span ref={ref} className="katex-inline" />
  );
}

/* ─── Rich Content Parser ─── */
// Parses text with $$block$$, $inline$, **bold**, `code`, and plain text
type Segment =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "code"; content: string }
  | { type: "math-inline"; content: string }
  | { type: "math-block"; content: string }
  | { type: "heading"; level: 2 | 3; content: string }
  | { type: "bullet"; items: string[] }
  | { type: "divider" }
  | { type: "callout"; kind: "note" | "formula" | "key"; content: string };

function parseContent(raw: string): Segment[] {
  const segments: Segment[] = [];
  const lines = raw.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      segments.push({ type: "divider" });
      i++;
      continue;
    }

    // Heading ##
    const h2match = line.match(/^##\s+(.*)/);
    if (h2match) {
      segments.push({ type: "heading", level: 2, content: h2match[1] });
      i++;
      continue;
    }

    // Heading ###
    const h3match = line.match(/^###\s+(.*)/);
    if (h3match) {
      segments.push({ type: "heading", level: 3, content: h3match[1] });
      i++;
      continue;
    }

    // Callout > [!NOTE] or > [!FORMULA] or > [!KEY]
    const calloutMatch = line.match(/^>\s*\[!(NOTE|FORMULA|KEY)\]\s*(.*)/i);
    if (calloutMatch) {
      const kindMap: Record<string, "note" | "formula" | "key"> = {
        NOTE: "note", FORMULA: "formula", KEY: "key"
      };
      let body = calloutMatch[2];
      i++;
      while (i < lines.length && lines[i].startsWith("> ")) {
        body += "\n" + lines[i].slice(2);
        i++;
      }
      segments.push({ type: "callout", kind: kindMap[calloutMatch[1].toUpperCase()], content: body });
      continue;
    }

    // Bullet list
    if (/^[-*•]\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s/, ""));
        i++;
      }
      segments.push({ type: "bullet", items });
      continue;
    }

    // Block math $$...$$
    if (line.trim().startsWith("$$")) {
      let mathContent = line.trim().slice(2);
      if (mathContent.endsWith("$$")) {
        segments.push({ type: "math-block", content: mathContent.slice(0, -2) });
        i++;
        continue;
      }
      i++;
      while (i < lines.length && !lines[i].trim().endsWith("$$")) {
        mathContent += "\n" + lines[i];
        i++;
      }
      if (i < lines.length) {
        mathContent += "\n" + lines[i].trim().slice(0, -2);
        i++;
      }
      segments.push({ type: "math-block", content: mathContent });
      continue;
    }

    // Regular paragraph line — parse inline elements
    if (line.trim() !== "") {
      const inlineSegments = parseInline(line);
      for (const seg of inlineSegments) {
        segments.push(seg);
      }
    }

    i++;
  }

  return segments;
}

function parseInline(text: string): Segment[] {
  const results: Segment[] = [];
  // Tokenize with regex: $$block$$, $inline$, **bold**, `code`, plain
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\*\*[^*]+?\*\*|`[^`]+?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      results.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("$$")) {
      results.push({ type: "math-block", content: token.slice(2, -2) });
    } else if (token.startsWith("$")) {
      results.push({ type: "math-inline", content: token.slice(1, -1) });
    } else if (token.startsWith("**")) {
      results.push({ type: "bold", content: token.slice(2, -2) });
    } else if (token.startsWith("`")) {
      results.push({ type: "code", content: token.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    results.push({ type: "text", content: text.slice(lastIndex) });
  }

  return results;
}

/* ─── Render Segment ─── */
function renderInlineSegments(segs: Segment[]): React.ReactNode {
  return segs.map((seg, i) => {
    if (seg.type === "text") return <span key={i}>{seg.content}</span>;
    if (seg.type === "bold") return <strong key={i} className="text-cyan-300 font-black">{seg.content}</strong>;
    if (seg.type === "code") return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] border border-emerald-900/40">{seg.content}</code>;
    if (seg.type === "math-inline") return <Math key={i} formula={seg.content} block={false} />;
    if (seg.type === "math-block") return <Math key={i} formula={seg.content} block />;
    return null;
  });
}

interface RichContentProps {
  content: string;
}

export function RichContent({ content }: RichContentProps) {
  const segments = parseContent(content);

  return (
    <div className="space-y-2 rich-content">
      {segments.map((seg, i) => {
        if (seg.type === "divider") {
          return <hr key={i} className="border-white/10 my-3" />;
        }

        if (seg.type === "heading") {
          return seg.level === 2 ? (
            <h2 key={i} className="text-sm font-black uppercase tracking-widest text-cyan-400 mt-4 mb-1 border-b border-cyan-500/20 pb-1">
              {seg.content}
            </h2>
          ) : (
            <h3 key={i} className="text-xs font-black uppercase tracking-wider text-purple-400 mt-3 mb-1">
              {seg.content}
            </h3>
          );
        }

        if (seg.type === "math-block") {
          return <Math key={i} formula={seg.content} block />;
        }

        if (seg.type === "bullet") {
          return (
            <ul key={i} className="space-y-1.5 ml-1">
              {seg.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm leading-relaxed text-slate-300">
                  <span className="text-cyan-500 mt-1 flex-shrink-0">›</span>
                  <span>{renderInlineSegments(parseInline(item))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (seg.type === "callout") {
          const styles = {
            note: { border: "border-blue-500/30", bg: "bg-blue-500/5", icon: "💡", label: "Note", labelColor: "text-blue-400" },
            formula: { border: "border-amber-500/30", bg: "bg-amber-500/5", icon: "🧮", label: "Key Formula", labelColor: "text-amber-400" },
            key: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", icon: "🔑", label: "Key Concept", labelColor: "text-emerald-400" },
          }[seg.kind];

          return (
            <div key={i} className={`rounded-xl border ${styles.border} ${styles.bg} p-4 my-3`}>
              <div className={`text-[10px] font-black uppercase tracking-widest ${styles.labelColor} mb-2 flex items-center gap-2`}>
                <span>{styles.icon}</span>
                {styles.label}
              </div>
              <div className="text-sm text-slate-300 leading-relaxed">
                {renderInlineSegments(parseInline(seg.content))}
              </div>
            </div>
          );
        }

        // Default inline paragraph rendering
        const inlineSegs = parseInline(
          seg.type === "text" ? seg.content :
          seg.type === "bold" ? `**${seg.content}**` :
          seg.type === "code" ? `\`${seg.content}\`` :
          seg.type === "math-inline" ? `$${seg.content}$` : ""
        );

        return (
          <p key={i} className="text-sm leading-relaxed text-slate-300">
            {renderInlineSegments(inlineSegs)}
          </p>
        );
      })}
    </div>
  );
}
