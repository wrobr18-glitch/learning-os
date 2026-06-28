"use client";

import React, { useState, useEffect, useRef } from "react";

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
}

interface ConceptNode {
  id: string;
  label: string;
  mastery: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface ConceptEdge {
  from: string;
  to: string;
}

/* ─── Static Data ─── */
const STUDY_TASKS: StudyTask[] = [
  {
    id: "1",
    title: "Semiconductor Physics",
    subtitle: "Band theory · Carrier density · Drift & diffusion",
    type: "prerequisite",
    duration: "25 min",
    mastery: 72,
  },
  {
    id: "2",
    title: "MOSFET Transconductance",
    subtitle: "UGC NET derivations · gm equations · small-signal model",
    type: "new",
    duration: "40 min",
  },
  {
    id: "3",
    title: "Spaced Recall: p-n Diodes",
    subtitle: "Ebbinghaus curve forecast · 4 revision flashcards",
    type: "revision",
    duration: "15 min",
    mastery: 88,
  },
  {
    id: "4",
    title: "FET Characteristics MCQ",
    subtitle: "Adaptive 8-question assessment · Mistake analysis",
    type: "assessment",
    duration: "20 min",
  },
];

const CONCEPT_NODES: ConceptNode[] = [
  { id: "semi", label: "Semiconductors", mastery: 72, x: 50, y: 50, color: "#06b6d4", size: 52 },
  { id: "diode", label: "Diode", mastery: 88, x: 22, y: 68, color: "#10b981", size: 44 },
  { id: "bjt", label: "BJT", mastery: 55, x: 50, y: 78, color: "#f59e0b", size: 40 },
  { id: "fet", label: "FET", mastery: 63, x: 78, y: 68, color: "#8b5cf6", size: 42 },
  { id: "mosfet", label: "MOSFET", mastery: 34, x: 78, y: 42, color: "#ec4899", size: 38 },
  { id: "opamp", label: "Op-Amp", mastery: 20, x: 50, y: 22, color: "#64748b", size: 34 },
];

const CONCEPT_EDGES: ConceptEdge[] = [
  { from: "semi", to: "diode" },
  { from: "semi", to: "bjt" },
  { from: "semi", to: "fet" },
  { from: "fet", to: "mosfet" },
  { from: "bjt", to: "opamp" },
  { from: "mosfet", to: "opamp" },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "ai",
    content:
      "Hello! I'm your Learning OS Cognitive Engine. I've analyzed your study genome and I see you're preparing for UGC NET Electronics. Today, let's tackle MOSFET transconductance. \n\nFirst — can you tell me what you understand about the relationship between drain current ID and gate voltage VGS in the saturation region?",
    timestamp: "09:00 AM",
  },
];

/* ─── Helper Components ─── */
function TaskTypeChip({ type }: { type: StudyTask["type"] }) {
  const styles: Record<string, string> = {
    new: "badge-cyan",
    revision: "badge-purple",
    prerequisite: "badge-amber",
    assessment: "badge-emerald",
  };
  const labels: Record<string, string> = {
    new: "New Concept",
    revision: "Revision",
    prerequisite: "Prerequisite",
    assessment: "Assessment",
  };
  return <span className={styles[type]}>{labels[type]}</span>;
}

function MasteryBar({ mastery, color = "cyan" }: { mastery: number; color?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(mastery), 300);
    return () => clearTimeout(t);
  }, [mastery]);

  return (
    <div className="progress-bar">
      <div
        className={`progress-fill-${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function StreamingIndicator() {
  return (
    <div className="streaming-dots flex items-center gap-0.5 py-1">
      <span /><span /><span />
    </div>
  );
}

function KernelStatusDot() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex">
        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </div>
      <span className="text-xs font-medium text-slate-400">Kernel Online</span>
    </div>
  );
}

/* ─── Knowledge Graph Component ─── */
function KnowledgeGraph({
  nodes,
  edges,
}: {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>("semi");

  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <div className="relative w-full" style={{ paddingBottom: "90%" }}>
      <div className="absolute inset-0">
        {/* SVG Edges */}
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          <defs>
            <filter id="glow-edge">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {edges.map((edge, i) => {
            const from = getNode(edge.from);
            const to = getNode(edge.to);
            if (!from || !to) return null;
            const isActive = selected === edge.from || selected === edge.to || hovered === edge.from || hovered === edge.to;
            return (
              <line
                key={i}
                x1={`${from.x}%`} y1={`${from.y}%`}
                x2={`${to.x}%`} y2={`${to.y}%`}
                stroke={isActive ? from.color : "rgba(100,116,139,0.2)"}
                strokeWidth={isActive ? 1.5 : 0.8}
                strokeDasharray={isActive ? "none" : "4 4"}
                style={{ filter: isActive ? "url(#glow-edge)" : "none", transition: "all 0.3s" }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selected === node.id;
          const isHovered = hovered === node.id;
          return (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 cursor-pointer"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(node.id)}
            >
              {/* Ring around selected node */}
              {isSelected && (
                <div
                  className="absolute rounded-full border border-current animate-pulse"
                  style={{
                    width: node.size + 16,
                    height: node.size + 16,
                    color: node.color,
                    borderColor: node.color,
                    opacity: 0.4,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              )}
              <div
                className="rounded-full flex items-center justify-center font-bold text-white"
                style={{
                  width: isSelected || isHovered ? node.size + 8 : node.size,
                  height: isSelected || isHovered ? node.size + 8 : node.size,
                  background: `radial-gradient(circle at 35% 35%, ${node.color}cc, ${node.color}66)`,
                  border: `2px solid ${node.color}`,
                  boxShadow: isSelected
                    ? `0 0 20px ${node.color}80, 0 0 40px ${node.color}30`
                    : isHovered
                    ? `0 0 12px ${node.color}50`
                    : "none",
                  fontSize: node.size > 44 ? 11 : 9,
                  transition: "all 0.2s ease",
                }}
              >
                {node.mastery}%
              </div>
              <span
                className="text-center font-medium whitespace-nowrap"
                style={{
                  fontSize: 10,
                  color: isSelected ? node.color : "rgba(148,163,184,0.8)",
                  transition: "color 0.2s",
                }}
              >
                {node.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected node info */}
      {selected && (() => {
        const node = getNode(selected);
        if (!node) return null;
        return (
          <div className="absolute bottom-0 left-0 right-0 p-3 rounded-xl glass-panel animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: node.color }}>{node.label}</span>
              <span className="text-xs text-slate-400">Mastery: {node.mastery}%</span>
            </div>
            <MasteryBar mastery={node.mastery} color={node.color === "#06b6d4" ? "cyan" : "purple"} />
          </div>
        );
      })()}
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "graph" | "planner">("dashboard");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response (will be replaced with actual API call)
    setTimeout(() => {
      const aiResponses = [
        "Great question! Let's think about this together. In the saturation region, the MOSFET drain current follows ID = (μn·Cox·W)/(2L) · (VGS - Vth)². Notice the quadratic relationship here. \n\nNow, transconductance gm is defined as ∂ID/∂VGS at constant VDS. Can you try differentiating that expression?",
        "Exactly right! You're making strong connections. The transconductance gm = μn·Cox·(W/L)·(VGS - Vth) = 2·ID/(VGS - Vth). This is crucial for UGC NET. \n\nHere's a follow-up: if we double the drain current while keeping (VGS - Vth) fixed, what happens to gm?",
        "That's a common misconception — let me help clarify with a Socratic hint. Think about what happens physically to the channel when VDS exceeds (VGS - Vth). The channel 'pinches off' near the drain. What does this imply about the relationship between ID and VDS in saturation?",
      ];
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: randomResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsTyping(false);
    }, 1800);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "chat", label: "AI Tutor", icon: "◎" },
    { id: "graph", label: "Knowledge Graph", icon: "⬡" },
    { id: "planner", label: "Study Planner", icon: "◷" },
  ];

  const stats = [
    { label: "Study Streak", value: "3 Days", icon: "🔥", sub: "+1 from yesterday", color: "amber" },
    { label: "Concepts Mastered", value: "14 / 38", icon: "🧠", sub: "37% of syllabus", color: "cyan" },
    { label: "Revision Due", value: "4 cards", icon: "📋", sub: "Next: p-n Diodes", color: "purple" },
    { label: "Session Score", value: "82%", icon: "⚡", sub: "Last assessment", color: "emerald" },
  ];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ─── Sidebar ─── */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} flex-shrink-0 flex flex-col glass-panel border-r border-white/5 transition-all duration-300 sticky top-0 h-screen`}
      >
        {/* Logo */}
        <div className={`p-5 flex items-center ${sidebarOpen ? "gap-3" : "justify-center"} border-b border-white/5`}>
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center animate-pulse-glow"
            style={{
              background: "linear-gradient(135deg, #0e7490, #8b5cf6)",
            }}>
            <span className="text-white font-black text-sm">L</span>
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <div className="font-bold text-sm gradient-text-cyan">Learning OS</div>
              <div className="text-xs text-slate-500">v1.0 · Cognitive Kernel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`nav-item w-full text-left ${activeTab === item.id ? "active" : ""} ${!sidebarOpen ? "justify-center px-2" : ""}`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Student Profile */}
        <div className={`p-4 border-t border-white/5 ${sidebarOpen ? "" : "flex justify-center"}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #0891b2, #8b5cf6)" }}>
                W
              </div>
              <div>
                <div className="text-xs font-semibold">WROBR 45</div>
                <div className="text-xs text-slate-500">UGC NET Electronics</div>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #0891b2, #8b5cf6)" }}>
              W
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass-panel border border-white/10 flex items-center justify-center text-slate-400 hover:text-white text-xs"
        >
          {sidebarOpen ? "‹" : "›"}
        </button>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 glass-panel sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold gradient-text-cyan" id="page-title">
              {activeTab === "dashboard" && "Study Dashboard"}
              {activeTab === "chat" && "AI Socratic Tutor"}
              {activeTab === "graph" && "Knowledge Graph"}
              {activeTab === "planner" && "Study Planner"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <KernelStatusDot />
            <div className="badge-amber">UGC NET 2025</div>
          </div>
        </header>

        {/* ─── DASHBOARD TAB ─── */}
        {activeTab === "dashboard" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-card animate-slide-up">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{stat.icon}</span>
                    <span className={`badge-${stat.color}`}>{stat.sub}</span>
                  </div>
                  <div className="mt-1">
                    <div className="text-2xl font-black gradient-text-cyan">{stat.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Today's Plan */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base gradient-text-cyan">Today's Study Plan</h2>
                  <span className="text-xs text-slate-500">4 tasks · ~100 min</span>
                </div>

                <div className="space-y-3">
                  {STUDY_TASKS.map((task, i) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-4 p-4 rounded-xl cursor-pointer animate-slide-up"
                      style={{
                        background: "rgba(15, 23, 42, 0.5)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        animationDelay: `${i * 80}ms`,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(6,182,212,0.2)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(6,182,212,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(15, 23, 42, 0.5)";
                      }}
                    >
                      {/* Index circle */}
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ background: "rgba(6,182,212,0.12)", color: "#22d3ee" }}>
                        {i + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-100">{task.title}</span>
                          <TaskTypeChip type={task.type} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{task.subtitle}</p>
                        {task.mastery !== undefined && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1"><MasteryBar mastery={task.mastery} /></div>
                            <span className="text-xs text-slate-500">{task.mastery}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-slate-500 mb-1.5">{task.duration}</div>
                        <button
                          id={`task-btn-${task.id}`}
                          className="btn-primary text-xs py-1.5 px-3"
                          onClick={() => setActiveTab("chat")}
                        >
                          {task.type === "assessment" ? "Assess" : task.type === "revision" ? "Revise" : "Learn"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Knowledge Graph Sidebar */}
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base gradient-text-purple">Knowledge Graph</h2>
                  <button className="btn-ghost text-xs py-1 px-2" onClick={() => setActiveTab("graph")}>Expand →</button>
                </div>

                <KnowledgeGraph nodes={CONCEPT_NODES} edges={CONCEPT_EDGES} />

                <div className="pt-2 border-t border-white/5">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Overall Mastery</span>
                    <span className="text-cyan-400 font-bold">55%</span>
                  </div>
                  <MasteryBar mastery={55} />
                </div>
              </div>
            </div>

            {/* AI Quick Insights */}
            <div className="glass-panel-cyan rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #0e7490, #0891b2)" }}>
                  <span className="text-white text-base">🤖</span>
                </div>
                <div>
                  <div className="font-semibold text-sm text-cyan-300 mb-1">AI Cognitive Insight</div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Based on your genome, you typically struggle with{" "}
                    <span className="text-cyan-400 font-medium">equation derivations under exam time pressure</span>.
                    Your mistake log shows 3 recurring errors in MOSFET small-signal analysis. I recommend spending extra
                    time on gm and rds derivations before attempting the assessment today.
                  </p>
                  <button
                    id="btn-start-socratic"
                    className="btn-primary mt-3 text-xs"
                    onClick={() => setActiveTab("chat")}
                  >
                    Start Socratic Session →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── CHAT TAB ─── */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === "ai" ? "" : ""}`}
                    style={{
                      background: msg.role === "ai"
                        ? "linear-gradient(135deg, #0e7490, #8b5cf6)"
                        : "linear-gradient(135deg, #0891b2, #06b6d4)",
                    }}>
                    {msg.role === "ai" ? "AI" : "W"}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[70%] ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"} p-4`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                    <div className={`text-xs mt-2 ${msg.role === "user" ? "text-cyan-200/60" : "text-slate-600"}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #0e7490, #8b5cf6)" }}>
                    AI
                  </div>
                  <div className="chat-bubble-ai px-5 py-3">
                    <StreamingIndicator />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-4 border-t border-white/5 glass-panel">
              <div className="flex gap-3 items-end max-w-4xl mx-auto">
                <textarea
                  id="chat-input"
                  className="chat-input-field flex-1"
                  placeholder="Ask your tutor a question, request an explanation, or say 'Give me a hint'..."
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
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="btn-primary flex-shrink-0 px-4 py-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ➤
                </button>
              </div>
              <p className="text-center text-xs text-slate-600 mt-2">
                Powered by OpenRouter · Llama 3.3 70B · ChatGPT Browser fallback
              </p>
            </div>
          </div>
        )}

        {/* ─── GRAPH TAB ─── */}
        {activeTab === "graph" && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Full Graph */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
                <h2 className="font-bold text-base gradient-text-purple mb-4">Electronics Knowledge Graph</h2>
                <div className="relative" style={{ paddingBottom: "75%" }}>
                  <div className="absolute inset-0">
                    <KnowledgeGraph nodes={CONCEPT_NODES} edges={CONCEPT_EDGES} />
                  </div>
                </div>
              </div>

              {/* Legend & details */}
              <div className="space-y-4">
                <div className="glass-panel rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-sm text-slate-300">Concept Mastery Legend</h3>
                  {CONCEPT_NODES.map((node) => (
                    <div key={node.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: node.color }} />
                        <span className="text-xs text-slate-300">{node.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 progress-bar">
                          <div className="progress-fill-cyan" style={{ width: `${node.mastery}%`, background: node.color }} />
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color: node.color }}>
                          {node.mastery}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass-panel-purple rounded-2xl p-5">
                  <h3 className="font-bold text-sm text-purple-300 mb-3">Recommended Next</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-purple-400">→</span>
                      MOSFET Transconductance (34% mastery)
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-purple-400">→</span>
                      Op-Amp Circuits (20% mastery)
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-purple-400">→</span>
                      BJT Amplifiers (55% mastery)
                    </div>
                  </div>
                  <button className="btn-primary w-full mt-4 text-xs" onClick={() => setActiveTab("chat")}>
                    Start Learning →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── PLANNER TAB ─── */}
        {activeTab === "planner" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Weekly Progress */}
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="font-bold text-base gradient-text-cyan mb-4">Weekly Progress</h2>
                <div className="space-y-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                    const done = i < 3;
                    const today = i === 3;
                    const progress = done ? 80 + Math.random() * 20 : today ? 45 : 0;
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className={`text-xs w-8 font-medium ${today ? "text-cyan-400" : done ? "text-slate-400" : "text-slate-600"}`}>
                          {day}
                        </span>
                        <div className="flex-1 progress-bar">
                          <div
                            className="progress-fill-cyan"
                            style={{ width: `${progress}%`, opacity: today ? 1 : done ? 0.7 : 0.2 }}
                          />
                        </div>
                        <span className="text-xs font-mono w-8 text-right" style={{ color: today ? "#22d3ee" : "#475569" }}>
                          {progress > 0 ? `${Math.round(progress)}%` : "—"}
                        </span>
                        {done && <span className="text-emerald-400 text-xs">✓</span>}
                        {today && <span className="badge-cyan">Today</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revision Schedule */}
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="font-bold text-base gradient-text-purple mb-4">Spaced Repetition Queue</h2>
                <div className="space-y-3">
                  {[
                    { concept: "p-n Diode IV Characteristics", due: "Today", interval: "3 days", urgency: "high" },
                    { concept: "Semiconductor Carrier Equations", due: "Tomorrow", interval: "7 days", urgency: "medium" },
                    { concept: "FET Pinch-off Voltage", due: "Day after", interval: "14 days", urgency: "low" },
                    { concept: "BJT h-parameters", due: "In 3 days", interval: "21 days", urgency: "low" },
                  ].map((item) => (
                    <div key={item.concept}
                      className="flex items-start justify-between p-3 rounded-xl"
                      style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{item.concept}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Interval: {item.interval}</div>
                      </div>
                      <div className="text-right">
                        <span className={`badge-${item.urgency === "high" ? "amber" : item.urgency === "medium" ? "purple" : "emerald"}`}>
                          {item.due}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn-primary w-full mt-4 text-xs" onClick={() => setActiveTab("chat")}>
                  Start Revision Session →
                </button>
              </div>

              {/* Exam Countdown */}
              <div className="lg:col-span-2 glass-panel-cyan rounded-2xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="font-bold text-base gradient-text-cyan">UGC NET Electronics 2025</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Estimated preparation: 70 study days remaining</p>
                  </div>
                  <div className="flex gap-4">
                    {[
                      { n: "70", label: "Days" },
                      { n: "38", label: "Concepts" },
                      { n: "14", label: "Mastered" },
                    ].map(({ n, label }) => (
                      <div key={label} className="text-center">
                        <div className="text-2xl font-black gradient-text-cyan">{n}</div>
                        <div className="text-xs text-slate-500">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Syllabus Completion</span>
                    <span className="text-cyan-400 font-bold">37%</span>
                  </div>
                  <MasteryBar mastery={37} />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
