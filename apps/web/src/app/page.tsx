"use client";

import React, { useState, useEffect, useRef } from "react";
import { RichContent } from "../components/RichContent";
import { getSocraticResponse } from "../lib/socraticEngine";

/* ─── Types ─── */
interface StudyTask {
  id: string;
  title: string;
  subtitle: string;
  type: "new" | "revision" | "prerequisite" | "assessment";
  duration: string;
  mastery?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  latency?: string;
  provider?: string;
}

interface ConceptNode {
  id: string;
  label: string;
  mastery: number;
  x: number;
  y: number;
  color: string;
  accent: string;
  size: number;
  state: "locked" | "unlocked" | "completed" | "revision";
}

interface ConceptEdge {
  from: string;
  to: string;
}

/* ─── Data Sets ─── */
const STUDY_TASKS: StudyTask[] = [
  {
    id: "1",
    title: "Semiconductor Physics",
    subtitle: "Band theory · Carrier density · Drift & diffusion coefficients",
    type: "prerequisite",
    duration: "25 min",
    mastery: 72,
  },
  {
    id: "2",
    title: "MOSFET Transconductance",
    subtitle: "UGC NET derivations · gm formulas · Small-signal models",
    type: "new",
    duration: "40 min",
  },
  {
    id: "3",
    title: "Spaced Recall: p-n Diodes",
    subtitle: "Ebbinghaus curve forecast · 4 active recall flashcards",
    type: "revision",
    duration: "15 min",
    mastery: 88,
  },
  {
    id: "4",
    title: "FET Characteristics MCQ",
    subtitle: "Adaptive 8-question quiz · Mistakes log classifier",
    type: "assessment",
    duration: "20 min",
  },
];

const CONCEPT_NODES: ConceptNode[] = [
  { id: "semi", label: "Semiconductors", mastery: 72, x: 250, y: 200, color: "#06b6d4", accent: "cyan", size: 30, state: "completed" },
  { id: "diode", label: "Diode", mastery: 88, x: 100, y: 260, color: "#10b981", accent: "emerald", size: 26, state: "completed" },
  { id: "bjt", label: "BJT", mastery: 55, x: 250, y: 320, color: "#fbbf24", accent: "amber", size: 26, state: "unlocked" },
  { id: "fet", label: "FET", mastery: 63, x: 400, y: 260, color: "#8b5cf6", accent: "purple", size: 26, state: "unlocked" },
  { id: "mosfet", label: "MOSFET", mastery: 34, x: 400, y: 110, color: "#ec4899", accent: "pink", size: 26, state: "revision" },
  { id: "opamp", label: "Op-Amp", mastery: 12, x: 250, y: 80, color: "#64748b", accent: "slate", size: 24, state: "locked" },
];

const CONCEPT_EDGES: ConceptEdge[] = [
  { from: "semi", to: "diode" },
  { from: "semi", to: "bjt" },
  { from: "semi", to: "fet" },
  { from: "fet", to: "mosfet" },
  { from: "bjt", to: "opamp" },
  { from: "mosfet", to: "opamp" },
];

const getNode = (id: string) => CONCEPT_NODES.find((n) => n.id === id);

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "ai",
    content: `## Welcome — Socratic Session: MOSFET Transconductance

Hello! I'm your **Cognitive Tutor**. I've analyzed your student genome and identified that **MOSFET transconductance** is today's priority objective.

> [!NOTE]
> Your mistake log shows 3 recurring errors in transconductance derivations. We'll address them systematically using the **Socratic method** — I won't give you direct answers, but guide you to discover them.

---

## Lesson Objective

By the end of this session, you will be able to:
- Derive the expression for $g_m$ from first principles
- State the three equivalent forms of the $g_m$ equation
- Explain physically why $g_m$ depends on $I_D$ and device geometry

---

## Opening Question

Consider a MOSFET biased in the **saturation region**. The drain current is governed by:

$$I_D = \\frac{\\mu_n C_{ox}}{2} \\cdot \\frac{W}{L} \\cdot (V_{GS} - V_{th})^2$$

Looking at this expression carefully — **what does the exponent of $(V_{GS} - V_{th})$ tell you** about the nature of the $I_D$ vs. $V_{GS}$ relationship? Is it linear, quadratic, or exponential?`,
    timestamp: "09:00 AM",
    provider: "ChatGPT Browser",
    latency: "1.2s",
  },
];

/* ─── Micro Components ─── */
function TaskTypeChip({ type }: { type: StudyTask["type"] }) {
  const styles = {
    new: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    revision: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    prerequisite: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    assessment: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  const labels = {
    new: "New Concept",
    revision: "Revision Due",
    prerequisite: "Prerequisite",
    assessment: "Assessment",
  };
  return (
    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border tracking-wider ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

function ProgressCircle({ percentage, size = 36, strokeWidth = 3, color = "cyan" }: { percentage: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`var(--c-${color}, ${color})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            // Fallback colors matching Tailwind
            color: color === "cyan" ? "#22d3ee" : color === "emerald" ? "#10b981" : color === "amber" ? "#fbbf24" : color === "purple" ? "#a78bfa" : color === "pink" ? "#f472b6" : "#94a3b8"
          } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono text-slate-300">
        {percentage}%
      </div>
    </div>
  );
}

/* ─── Advanced SVG Knowledge Graph ─── */
function KnowledgeGraphSVG({
  nodes,
  edges,
  selectedId,
  onSelectNode,
}: {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  selectedId: string | null;
  onSelectNode: (id: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <div className="relative w-full aspect-[5/4] glass-panel rounded-2xl overflow-hidden border border-white/5 bg-slate-950/40">
      {/* Background Tech Grid effect */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#0891b2_1px,transparent_1px),linear-gradient(to_bottom,#0891b2_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <svg
        viewBox="0 0 500 400"
        className="w-full h-full relative z-10"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Glowing Filters */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-edge" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Node Gradients */}
          {nodes.map((node) => (
            <radialGradient key={node.id} id={`grad-${node.id}`} cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
              <stop offset="100%" stopColor={node.color} stopOpacity={0.3} />
            </radialGradient>
          ))}
          
          {/* Arrowhead Marker */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="20"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 10 5 L 0 8 z" fill="rgba(100,116,139,0.3)" />
          </marker>
        </defs>

        {/* ─── Edges Layer ─── */}
        {edges.map((edge, i) => {
          const fromNode = getNode(edge.from);
          const toNode = getNode(edge.to);
          if (!fromNode || !toNode) return null;

          const isActive =
            selectedId === edge.from ||
            selectedId === edge.to ||
            hoveredId === edge.from ||
            hoveredId === edge.to;

          // Curve paths for organic connection look
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const cx = (fromNode.x + toNode.x) / 2 + dy * 0.1;
          const cy = (fromNode.y + toNode.y) / 2 - dx * 0.1;
          const pathD = `M ${fromNode.x} ${fromNode.y} Q ${cx} ${cy} ${toNode.x} ${toNode.y}`;

          return (
            <g key={i}>
              {/* Background Glow Path */}
              {isActive && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={fromNode.color}
                  strokeWidth="3.5"
                  strokeOpacity="0.3"
                  style={{ filter: "url(#glow-edge)" }}
                />
              )}
              {/* Main connection line */}
              <path
                d={pathD}
                fill="none"
                stroke={isActive ? fromNode.color : "rgba(148, 163, 184, 0.2)"}
                strokeWidth={isActive ? "2" : "1.2"}
                strokeDasharray={isActive ? "none" : "3 3"}
                markerEnd="url(#arrow)"
                style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
              />
              {/* Flow particles showing learning pathway */}
              {isActive && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={fromNode.color}
                  strokeWidth="2.5"
                  className="animate-dash-flow"
                  strokeOpacity="0.8"
                />
              )}
            </g>
          );
        })}

        {/* ─── Nodes Layer ─── */}
        {nodes.map((node) => {
          const isSelected = selectedId === node.id;
          const isHovered = hoveredId === node.id;
          const isInteractive = isSelected || isHovered;

          // Mastery Progress Ring calculations
          const r = node.size + 4;
          const circ = 2 * Math.PI * r;
          const offset = circ - (node.mastery / 100) * circ;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer select-none"
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectNode(node.id)}
            >
              {/* Selected Pulse Background */}
              {isSelected && (
                <circle
                  r={node.size + 14}
                  fill="transparent"
                  stroke={node.color}
                  strokeWidth="1.5"
                  strokeOpacity="0.3"
                  className="animate-ping"
                  style={{ transformOrigin: "0px 0px" }}
                />
              )}

              {/* Halo Outer Glow */}
              <circle
                r={isInteractive ? node.size + 8 : node.size + 3}
                fill="transparent"
                stroke={node.color}
                strokeWidth="1.5"
                strokeOpacity={isInteractive ? 0.3 : 0.1}
                style={{ transition: "all 0.3s" }}
              />

              {/* Progress Ring (Mastery Indicator) */}
              <circle
                r={r}
                fill="transparent"
                stroke={node.color}
                strokeWidth="2.5"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeOpacity={isInteractive ? 0.9 : 0.55}
                transform="rotate(-90)"
                style={{ transition: "all 0.3s" }}
              />

              {/* Central Solid Node */}
              <circle
                r={node.size}
                fill={`url(#grad-${node.id})`}
                stroke={node.color}
                strokeWidth="2"
                style={{
                  filter: isInteractive ? "url(#glow-cyan)" : "none",
                  transition: "all 0.3s",
                }}
              />

              {/* Status Icons Overlay */}
              {node.state === "completed" && (
                <path
                  d="M -5 0 L -1 4 L 5 -3"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {node.state === "locked" && (
                <g transform="translate(0, -1)">
                  <rect x="-4" y="-1" width="8" height="6" rx="1.5" fill="none" stroke="#ffffff" strokeWidth="1.8" />
                  <path d="M -2.5 -1 L -2.5 -3.5 A 2.5 2.5 0 0 1 2.5 -3.5 L 2.5 -1" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                </g>
              )}
              {node.state === "revision" && (
                <path
                  d="M -4 -2 A 4.5 4.5 0 1 1 -2 4 M -5 -5 L -4 -1 L 0 -1"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
              {node.state === "unlocked" && (
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="black"
                  fontFamily="monospace"
                >
                  {node.mastery}%
                </text>
              )}

              {/* Node Label Text */}
              <text
                textAnchor="middle"
                y={node.size + 19}
                fill={isInteractive ? "#ffffff" : "rgba(148, 163, 184, 0.75)"}
                fontSize={isInteractive ? "10.5" : "9"}
                fontWeight={isInteractive ? "900" : "500"}
                style={{ transition: "all 0.3s" }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Main Interface ─── */
export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "graph" | "planner">("dashboard");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("semi");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeNode = CONCEPT_NODES.find((n) => n.id === selectedNodeId) || CONCEPT_NODES[0];

  const sendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputValue;
    const trimmed = promptToSend.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputValue("");
    setIsTyping(true);

    // Topic-aware Socratic AI response engine
    setTimeout(() => {
      const response = getSocraticResponse(trimmed);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: response,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          provider: "ChatGPT Browser",
          latency: "1.8s",
        },
      ]);
      setIsTyping(false);
    }, 1800);
  };

  const stats = [
    { label: "Study Streak", value: "3 Days", icon: "🔥", sub: "+1 today", color: "amber" },
    { label: "Syllabus Mastery", value: "14 / 38", icon: "🧠", sub: "37% Complete", color: "cyan" },
    { label: "Revision Cards", value: "4 Due", icon: "📋", sub: "Next: Diodes", color: "purple" },
    { label: "Socratic Score", value: "82%", icon: "⚡", sub: "Avg. Accuracy", color: "emerald" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/20">
      
      {/* ─── SIDEBAR NAVIGATION ─── */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} flex-shrink-0 flex flex-col glass-panel border-r border-white/5 transition-all duration-300 relative sticky top-0 h-screen z-20 bg-slate-950/80`}>
        
        {/* Brand Logo */}
        <div className={`p-5 flex items-center ${sidebarOpen ? "gap-3" : "justify-center"} border-b border-white/5`}>
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-tr from-cyan-600 to-purple-600 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse-glow">
            <span className="text-white font-black text-base tracking-wider">Ω</span>
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <div className="font-extrabold text-sm tracking-tight gradient-text-cyan">Learning OS</div>
              <div className="text-[10px] text-slate-500 font-mono">Cognitive Kernel v1.0</div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-3 flex flex-col gap-1.5 mt-4">
          {[
            { id: "dashboard", label: "Dashboard", icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
            )},
            { id: "chat", label: "Socratic Tutor", icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            )},
            { id: "graph", label: "Knowledge Fabric", icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
            )},
            { id: "planner", label: "Study Planner", icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 7V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
            )},
          ].map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 w-full text-left ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-cyan-950/40 to-slate-900/40 text-cyan-400 border-l-2 border-cyan-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/30"
              } ${!sidebarOpen ? "justify-center px-0" : ""}`}
            >
              {item.icon}
              {sidebarOpen && <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Account Genome card */}
        <div className={`p-4 border-t border-white/5 bg-slate-950/40 ${sidebarOpen ? "" : "flex justify-center"}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black bg-gradient-to-tr from-cyan-500 to-emerald-500 text-white">
                W
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate text-slate-200">WROBR 45</div>
                <div className="text-[10px] text-slate-500 truncate font-mono">Student Genome V1</div>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black bg-gradient-to-tr from-cyan-500 to-emerald-500 text-white">
              W
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass-panel border border-white/10 flex items-center justify-center text-slate-400 hover:text-white text-xs z-30"
        >
          {sidebarOpen ? "‹" : "›"}
        </button>
      </aside>

      {/* ─── MAIN CONTENT VIEW ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header Bar */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 glass-panel sticky top-0 z-10 bg-slate-950/70">
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase gradient-text-cyan" id="page-title">
              {activeTab === "dashboard" && "Cognitive Command Dashboard"}
              {activeTab === "chat" && "Socratic Dialogue Portal"}
              {activeTab === "graph" && "Knowledge Fabric Graph"}
              {activeTab === "planner" && "Daily Revision Scheduler"}
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* System Online Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] uppercase font-black text-emerald-400 font-mono tracking-wider">Kernel Active</span>
            </div>
            
            <div className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded border border-amber-500/20 bg-amber-500/5 text-amber-400 font-mono">
              UGC NET ECE
            </div>
          </div>
        </header>

        {/* ─── TAB CONTENT: DASHBOARD ─── */}
        {activeTab === "dashboard" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 animate-fade-in no-scrollbar">

            {/* Stats Summary Panel */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-card glass-panel rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{stat.icon}</span>
                    <span className="text-[10px] uppercase font-black font-mono tracking-wide text-slate-400">{stat.sub}</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors">{stat.value}</div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Core Work Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Study plan panel */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                    <div>
                      <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-300">Daily Study Objectives</h2>
                      <p className="text-[10px] text-slate-500 mt-0.5">Recommended tasks matching current spaced repetition spacing</p>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">4 items · ~100 min</span>
                  </div>

                  <div className="space-y-3.5">
                    {STUDY_TASKS.map((task, i) => (
                      <div
                        key={task.id}
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-950/20 hover:border-cyan-500/20 hover:bg-cyan-500/5 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Radial Progress indicator */}
                          <div className="flex-shrink-0">
                            {task.mastery !== undefined ? (
                              <ProgressCircle percentage={task.mastery} size={38} color={task.type === "revision" ? "purple" : "cyan"} />
                            ) : (
                              <div className="w-[38px] h-[38px] rounded-full border border-slate-800 flex items-center justify-center bg-slate-900/40 text-xs font-mono font-black text-slate-500">
                                0%
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-sm text-slate-200 group-hover:text-white transition-colors">{task.title}</h3>
                              <TaskTypeChip type={task.type} />
                            </div>
                            <p className="text-xs text-slate-500 mt-1 truncate">{task.subtitle}</p>
                          </div>
                        </div>

                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="text-[10px] font-mono text-slate-500 mb-2">{task.duration}</div>
                          <button
                            id={`task-btn-${task.id}`}
                            className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded bg-cyan-600 text-white shadow-lg shadow-cyan-950/40 hover:bg-cyan-500 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                            onClick={() => {
                              if (task.type === "new") {
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    id: Date.now().toString(),
                                    role: "user",
                                    content: "Let's start learning MOSFET Transconductance.",
                                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                                  }
                                ]);
                                sendMessage("Let's start learning MOSFET Transconductance.");
                              }
                              setActiveTab("chat");
                            }}
                          >
                            Execute
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mini knowledge graph sidebar */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <div>
                      <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-300">Fabric Overview</h2>
                      <p className="text-[10px] text-slate-500 mt-0.5">Interactive tech-tree dependency graph</p>
                    </div>
                    <button
                      className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
                      onClick={() => setActiveTab("graph")}
                    >
                      Expand Graph →
                    </button>
                  </div>

                  <KnowledgeGraphSVG
                    nodes={CONCEPT_NODES}
                    edges={CONCEPT_EDGES}
                    selectedId={selectedNodeId}
                    onSelectNode={setSelectedNodeId}
                  />
                </div>

                <div className="pt-4 border-t border-white/5 mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-medium">Selected Node: <b className="text-cyan-400">{activeNode.label}</b></span>
                    <span className="font-mono text-cyan-300 font-bold">{activeNode.mastery}% Mastery</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${activeNode.mastery}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* AI Advisor Panel redone */}
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-slate-950/20 to-purple-950/10 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-cyan-500/5 rounded-tl-full blur-xl pointer-events-none" />
              <div className="flex items-start gap-4">
                
                {/* Visual brain hologram */}
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-pulse">
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-xs uppercase font-black tracking-widest text-cyan-300">Cognitive Genome Alert</h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    Based on study statistics, you typically experience high mistake rates in <span className="text-cyan-400 font-bold">derivation steps under time constraints</span>. 
                    I've classified 3 recurring errors in your MOSFET transconductance calculations. Proceed to learn the basic parameters before taking the test today.
                  </p>
                  <button
                    id="btn-start-socratic"
                    className="mt-3 text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-950/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    onClick={() => {
                      setActiveTab("chat");
                    }}
                  >
                    Start Socratic Session →
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ─── TAB CONTENT: CHAT TUTOR ─── */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
            
            {/* Chat viewport messages log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 animate-slide-up ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Persona avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black text-white ${
                      msg.role === "ai"
                        ? "bg-gradient-to-tr from-cyan-600 to-purple-600 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        : "bg-gradient-to-tr from-cyan-500 to-emerald-500"
                    }`}
                  >
                    {msg.role === "ai" ? "AI" : "W"}
                  </div>

                  {/* Message Bubble box */}
                  <div
                    className={`max-w-[75%] rounded-2xl p-5 border ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-cyan-900/60 to-cyan-950/60 border-cyan-500/20 text-slate-100 rounded-tr-none"
                        : "bg-slate-900/40 backdrop-blur-md border-white/5 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {/* Rich content renderer with LaTeX, markdown, callouts */}
                    {msg.role === "user" ? (
                      <p className="text-sm leading-relaxed text-slate-100 whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <RichContent content={msg.content} />
                    )}

                    {/* Meta info footer */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4 text-[10px] text-slate-500 font-mono">
                      <span>{msg.timestamp}</span>
                      {msg.role === "ai" && msg.provider && (
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-white/5">{msg.provider}</span>
                          {msg.latency && <span className="text-emerald-400 font-bold">{msg.latency}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming wait block */}
              {isTyping && (
                <div className="flex gap-4 animate-fade-in">
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black bg-gradient-to-tr from-cyan-600 to-purple-600 text-white">
                    AI
                  </div>
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl rounded-tl-none p-4 px-6 flex items-center">
                    <span className="text-xs text-slate-500 font-mono mr-3">Synthesizing response</span>
                    <ProgressCircle percentage={30} size={20} strokeWidth={2} color="cyan" />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Quick Socratic Suggestions bar */}
            <div className="px-6 py-2 bg-slate-950 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { label: "💡 Request Socratic Hint", action: "Can you give me a hint instead of the direct answer?" },
                { label: "🧮 Show mathematical formulas", action: "Show me the key equations for MOSFET transconductance." },
                { label: "📝 Generate practice MCQ", action: "Can you generate a UGC NET level MCQ on this concept?" },
                { label: "🔍 Explain simpler", action: "Could you simplify this derivation?" }
              ].map((chip) => (
                <button
                  key={chip.label}
                  className="flex-shrink-0 text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                  onClick={() => sendMessage(chip.action)}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat write input block */}
            <div className="p-4 border-t border-white/5 glass-panel bg-slate-950/60 backdrop-blur-md">
              <div className="flex gap-3 items-end max-w-4xl mx-auto">
                <textarea
                  id="chat-input"
                  className="chat-input-field flex-1 max-h-32 min-h-[50px] p-3 text-xs bg-slate-900 border border-white/5 rounded-xl font-sans"
                  placeholder="Enter response, request a hint, or state formulas..."
                  rows={2}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  id="btn-send-chat"
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className="h-[50px] w-[50px] rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2.5 text-[9px] font-mono text-slate-600">
                <span>Routing: OpenRouter (Llama 3.3 70B)</span>
                <span>•</span>
                <span>Fallback Mode: ChatGPT Web Client</span>
              </div>
            </div>

          </div>
        )}

        {/* ─── TAB CONTENT: KNOWLEDGE FABRIC FULL GRAPH ─── */}
        {activeTab === "graph" && (
          <div className="flex-1 p-6 overflow-y-auto animate-fade-in no-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Massive Full View Graph */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
                <div>
                  <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 mb-1">Interactive Syllabus Concept Web</h2>
                  <p className="text-[10px] text-slate-500 mb-4">Click nodes to expand details, dependencies, and prerequisite pathways</p>
                </div>
                
                <KnowledgeGraphSVG
                  nodes={CONCEPT_NODES}
                  edges={CONCEPT_EDGES}
                  selectedId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                />
              </div>

              {/* Sidebar metadata details panel */}
              <div className="space-y-6">
                
                {/* Node descriptor panel */}
                <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <ProgressCircle percentage={activeNode.mastery} size={42} color={activeNode.accent} />
                    <div>
                      <h3 className="font-black text-sm text-slate-100">{activeNode.label}</h3>
                      <span className="text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 rounded border border-white/10 bg-slate-900 text-slate-400">
                        {activeNode.state}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Concept Context</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Core building block for UGC NET Electronics Paper II. Covers mathematical parameters, characteristics, and practical operations.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Prerequisites</h4>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {CONCEPT_EDGES.filter(e => e.to === activeNode.id).map(e => {
                          const name = getNode(e.from)?.label || e.from;
                          return (
                            <span key={e.from} className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-white/5">
                              {name}
                            </span>
                          );
                        })}
                        {CONCEPT_EDGES.filter(e => e.to === activeNode.id).length === 0 && (
                          <span className="text-[10px] text-slate-600 font-mono">None (Base concept)</span>
                        )}
                      </div>
                    </div>

                    <button
                      className="w-full btn-primary text-xs py-2 rounded font-black uppercase tracking-wider mt-2.5"
                      onClick={() => {
                        if (activeNode.state !== "locked") {
                          setMessages((prev) => [
                            ...prev,
                            {
                              id: Date.now().toString(),
                              role: "user",
                              content: `Let's start learning ${activeNode.label}.`,
                              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                            }
                          ]);
                          sendMessage(`Let's start learning ${activeNode.label}.`);
                          setActiveTab("chat");
                        }
                      }}
                      disabled={activeNode.state === "locked"}
                    >
                      {activeNode.state === "locked" ? "Prerequisites Locked" : `Teach ${activeNode.label} →`}
                    </button>
                  </div>
                </div>

                {/* Legend list */}
                <div className="glass-panel rounded-2xl p-5 border border-white/5">
                  <h3 className="font-extrabold text-[10px] uppercase text-slate-500 tracking-wider mb-3">Syllabus Index Legend</h3>
                  <div className="space-y-2.5">
                    {CONCEPT_NODES.map((node) => (
                      <div key={node.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: node.color }} />
                          <span className="text-xs font-semibold text-slate-300">{node.label}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 bg-slate-900 rounded-full h-1 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${node.mastery}%`, background: node.color }} />
                          </div>
                          <span className="text-[10px] font-bold font-mono text-slate-500 w-8 text-right">{node.mastery}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: STUDY PLANNER ─── */}
        {activeTab === "planner" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 animate-fade-in no-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Weekly progress timeline */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 mb-4">Preparation Calendar</h2>
                <div className="space-y-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                    const done = i < 3;
                    const today = i === 3;
                    const val = done ? 80 + Math.random() * 20 : today ? 45 : 0;
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className={`text-xs w-8 font-extrabold font-mono uppercase tracking-wider ${today ? "text-cyan-400" : done ? "text-slate-400" : "text-slate-600"}`}>
                          {day}
                        </span>
                        <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full"
                            style={{ width: `${val}%`, opacity: today ? 1 : done ? 0.75 : 0.2 }}
                          />
                        </div>
                        <span className="text-[10px] font-bold font-mono w-8 text-right text-slate-400">
                          {val > 0 ? `${Math.round(val)}%` : "—"}
                        </span>
                        {done && <span className="text-emerald-400 text-xs font-bold">✓</span>}
                        {today && <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">Today</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revision list queue */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 mb-4">Memory Spacing Schedule</h2>
                <div className="space-y-3">
                  {[
                    { concept: "p-n Diode IV Curve", due: "Today", interval: "3 days", level: "high" },
                    { concept: "Semiconductor Drift Formula", due: "Tomorrow", interval: "7 days", level: "medium" },
                    { concept: "FET Channel Pinch-off", due: "Day after", interval: "14 days", level: "low" },
                    { concept: "BJT Hybrid Parameters", due: "In 3 days", interval: "21 days", level: "low" },
                  ].map((item) => (
                    <div
                      key={item.concept}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-slate-950/20"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200">{item.concept}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">Current Spaced Interval: {item.interval}</div>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        item.level === "high" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        item.level === "medium" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {item.due}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exam syllabus indicators */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 bg-gradient-to-r from-slate-950 via-slate-950 to-purple-950/15">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300">Exam Preparation Matrix</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">National Eligibility Test (NET) Electronics syllabus</p>
                  </div>
                  <div className="flex gap-4">
                    {[
                      { n: "70", label: "Days Left" },
                      { n: "38", label: "Total Concepts" },
                      { n: "14", label: "Completed" },
                    ].map(({ n, label }) => (
                      <div key={label} className="text-center bg-slate-950/50 px-3 py-1.5 rounded-lg border border-white/5 min-w-[70px]">
                        <div className="text-lg font-black font-mono text-cyan-400">{n}</div>
                        <div className="text-[8px] uppercase font-black text-slate-500 tracking-wider mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Syllabus Completion progress</span>
                    <span className="text-cyan-400 font-bold font-mono">37%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                    <div className="bg-gradient-to-r from-cyan-600 via-cyan-400 to-purple-500 h-full rounded-full" style={{ width: "37%" }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
