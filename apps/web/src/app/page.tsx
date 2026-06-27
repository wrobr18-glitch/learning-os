"use client";

import React, { useState, useEffect } from "react";
import { Button } from "ui";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Learner");

  useEffect(() => {
    // Basic verification fetch to ensure database is working
    setLoading(false);
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col items-center justify-start max-w-7xl mx-auto space-y-12">
      {/* Header section */}
      <header className="w-full flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent glow-text-cyan">
            Learning OS
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your Cognitive Digital Twin & AI Study Space</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-sm font-medium text-slate-400">Kernel: Online</span>
        </div>
      </header>

      {/* Main dashboard widgets grid */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Widget 1: Daily Learning Plan */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col space-y-4 md:col-span-2">
          <h2 className="text-lg font-semibold text-cyan-400">Today's Study Plan</h2>
          {loading ? (
            <div className="text-slate-500 animate-pulse text-sm">Loading daily tasks...</div>
          ) : (
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Prerequisites: Semiconductor Physics</span>
                  <span className="text-xs text-slate-500">Mastery check: Band Theory & Carrier density</span>
                </div>
                <Button variant="glass" className="text-xs py-1.5 px-3">Start Study</Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">New Concept: MOSFET Transconductance</span>
                  <span className="text-xs text-slate-500">UGC NET Level derivation & equation sets</span>
                </div>
                <Button variant="primary" className="text-xs py-1.5 px-3">Learn</Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Revision: Spaced Recall on Diodes</span>
                  <span className="text-xs text-slate-500">Forgotten curve forecast target: 82%</span>
                </div>
                <Button variant="secondary" className="text-xs py-1.5 px-3">Revise</Button>
              </div>
            </div>
          )}
        </div>

        {/* Widget 2: Student Learning Genome Stats */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col space-y-6">
          <h2 className="text-lg font-semibold text-cyan-400">Learning Genome</h2>
          
          <div className="flex flex-col space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">General Electronics Mastery</span>
                <span className="text-cyan-400 font-bold">42%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: "42%" }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Prerequisites Completed</span>
                <span className="text-cyan-400 font-bold">78%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: "78%" }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Current Study Streak</span>
                <span className="text-cyan-400 font-bold">3 Days 🔥</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
            <span className="text-xs text-slate-500">Target: UGC NET Electronics</span>
            <Button variant="glass" className="text-xs py-1.5 px-3">View Graph</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
