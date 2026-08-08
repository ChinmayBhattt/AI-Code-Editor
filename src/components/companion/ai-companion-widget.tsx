"use client";

import { useAICompanionStore } from "@/stores/ai-companion-store";
import { Sparkles, Bot, Code, Bug, CheckCircle2, ShieldCheck } from "lucide-react";

export function AICompanionWidget() {
  const { state, speechMessage, setState } = useAICompanionStore();

  const statusBadges = {
    idle: { label: "NOVA AI • ONLINE", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    thinking: { label: "THINKING...", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    coding: { label: "CODING...", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    analyzing: { label: "ANALYZING...", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
    debugging: { label: "DEBUGGING...", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    success: { label: "SUCCESS ✅", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
    error: { label: "ERROR ⚠️", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  };

  const badge = statusBadges[state] || statusBadges.idle;

  return (
    <div className="relative flex flex-col items-center justify-between border-b border-zinc-800/80 bg-gradient-to-b from-zinc-950 via-[#0a0a10] to-zinc-950 p-3 shrink-0 select-none">
      {/* Top Header Badge & State Control */}
      <div className="flex w-full items-center justify-between gap-2 mb-2 z-10">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Bot className="h-3 w-3" />
          </div>
          <span className="text-[11px] font-bold text-zinc-100 tracking-wide">
            AI Assistant Companion
          </span>
        </div>

        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Uploaded AI Companion Avatar Portrait with Cyber Glow Aura */}
      <div className="relative my-1 flex items-center justify-center">
        {/* Animated Cyber Ring Aura */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 blur-md opacity-60 animate-pulse" />

        <div className="relative h-28 w-28 rounded-full border-2 border-indigo-400/60 overflow-hidden shadow-2xl bg-zinc-900 group transition-transform hover:scale-105">
          <img
            src="/images/nova-avatar.png"
            alt="AI Companion Avatar"
            className="h-full w-full object-cover object-center"
          />

          {/* Status Indicator Dot */}
          <div className="absolute bottom-1 right-2 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950 shadow" />
        </div>
      </div>

      {/* Speech Bubble */}
      <div className="relative w-full mt-2 rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-2.5 shadow-lg backdrop-blur z-10">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
          <p className="text-xs text-indigo-100 font-medium leading-relaxed">
            {speechMessage}
          </p>
        </div>
      </div>

      {/* Quick State Presets */}
      <div className="flex items-center justify-between gap-1 w-full mt-2 pt-2 border-t border-zinc-800/60 z-10">
        <button
          onClick={() => setState("coding", "Writing clean TypeScript code & components...")}
          className="flex-1 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-800 font-mono transition-colors"
        >
          💻 Code
        </button>
        <button
          onClick={() => setState("analyzing", "Analyzing codebase architecture & imports...")}
          className="flex-1 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-800 font-mono transition-colors"
        >
          🔍 Analyze
        </button>
        <button
          onClick={() => setState("debugging", "Inspecting runtime errors & console trace...")}
          className="flex-1 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-800 font-mono transition-colors"
        >
          🐞 Debug
        </button>
        <button
          onClick={() => setState("success", "Verified clean code execution! All tests passed.")}
          className="flex-1 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-emerald-400 border border-zinc-800 font-mono transition-colors"
        >
          ✅ Verify
        </button>
      </div>
    </div>
  );
}
