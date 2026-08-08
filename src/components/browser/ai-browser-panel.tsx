"use client";

import { useState, useEffect } from "react";
import { useBrowserAgentStore } from "@/stores/browser-agent-store";
import {
  Globe,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Play,
  Square,
  Bug,
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sparkles,
  ExternalLink,
  Bot,
  Terminal,
  ShieldCheck,
  Zap,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

export function AIBrowserPanel() {
  const {
    url,
    setUrl,
    history,
    historyIndex,
    goBack,
    goForward,
    isOpen,
    setIsOpen,
    isFullScreen,
    toggleFullScreen,
    activeTab,
    setActiveTab,
    status,
    currentTaskGoal,
    targetElementSelector,
    actionLogs,
    consoleErrors,
    bugsFound,
    runAgentTask,
    stopAgentTask,
    clearLogs,
  } = useBrowserAgentStore();

  const [inputUrl, setInputUrl] = useState(url);

  // Keep address bar input in sync with store URL changes
  useEffect(() => {
    setInputUrl(url);
  }, [url]);
  const [customPrompt, setCustomPrompt] = useState("");

  if (!isOpen) return null;

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    let final = inputUrl.trim();
    if (!final.startsWith("http://") && !final.startsWith("https://")) {
      final = "http://" + final;
    }
    setUrl(final);
  };

  const isRunning =
    status !== "idle" && status !== "completed" && status !== "failed";

  const getStatusBadge = () => {
    switch (status) {
      case "navigating":
        return { label: "NAVIGATING...", bg: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
      case "inspecting":
        return { label: "INSPECTING DOM...", bg: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
      case "interacting":
        return { label: "SIMULATING USER...", bg: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
      case "reproducing":
        return { label: "REPRODUCING BUG...", bg: "bg-rose-500/20 text-rose-300 border-rose-500/30" };
      case "analyzing_bug":
        return { label: "ANALYZING SOURCE CODE...", bg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" };
      case "fixing_code":
        return { label: "APPLYING AUTO-FIX...", bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-bold animate-pulse" };
      case "retesting":
        return { label: "RETESTING FLOW...", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
      case "completed":
        return { label: "PASSED / VERIFIED", bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
      default:
        return { label: "AGENT IDLE", bg: "bg-zinc-800 text-zinc-400 border-zinc-700" };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="flex h-full w-full flex-col bg-[#121215] border-l border-zinc-800 text-zinc-300 overflow-hidden select-none">
      {/* ── Browser Toolbar & Navigation Header ── */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 bg-[#18181b] px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Globe className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            AI Browser Agent
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
          </span>
        </div>

        {/* Navigation Buttons & Address Bar */}
        <form onSubmit={handleNavigate} className="flex flex-1 max-w-md items-center gap-1 mx-3">
          <button
            type="button"
            onClick={goBack}
            disabled={historyIndex <= 0}
            className={`p-1 rounded transition-colors ${
              historyIndex <= 0
                ? "text-zinc-600 cursor-not-allowed opacity-40"
                : "text-zinc-300 hover:text-white hover:bg-zinc-800"
            }`}
            title="Back"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className={`p-1 rounded transition-colors ${
              historyIndex >= history.length - 1
                ? "text-zinc-600 cursor-not-allowed opacity-40"
                : "text-zinc-300 hover:text-white hover:bg-zinc-800"
            }`}
            title="Forward"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setUrl(url)}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
            title="Refresh"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="http://localhost:3000"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 font-mono outline-none focus:border-blue-500/40"
          />
        </form>

        <div className="flex items-center gap-1.5">
          {isRunning ? (
            <button
              onClick={stopAgentTask}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all"
            >
              <Square className="h-3 w-3 fill-current" /> Stop
            </button>
          ) : (
            <button
              onClick={() => runAgentTask("Test website login flow and check for bugs", url)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              <Play className="h-3 w-3 fill-current" /> Run Agent Test
            </button>
          )}

          <button
            onClick={toggleFullScreen}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Browser"}
          >
            {isFullScreen ? (
              <Minimize2 className="h-3.5 w-3.5 text-blue-400" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Close Browser Agent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Sub Header: Quick Agent Commands & Tabs ── */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-3 py-1.5 text-xs shrink-0">
        {/* Preset Task Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-amber-400" /> Agent Quick Tests:
          </span>
          <button
            disabled={isRunning}
            onClick={() => runAgentTask("Test the login flow and check for auth errors", url)}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-800 shrink-0 transition-colors"
          >
            🧪 Test Login Flow
          </button>
          <button
            disabled={isRunning}
            onClick={() => runAgentTask("Find bugs, console errors, and broken routes in website", url)}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-800 shrink-0 transition-colors"
          >
            🔍 Audit Website Bugs
          </button>
          <button
            disabled={isRunning}
            onClick={() => runAgentTask("Test checkout shopping cart flow", url)}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-800 shrink-0 transition-colors"
          >
            🛒 Test Checkout Flow
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === "preview"
                ? "bg-blue-600 text-white font-semibold shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            🌐 Web View
          </button>
          <button
            onClick={() => setActiveTab("agent_logs")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === "agent_logs"
                ? "bg-blue-600 text-white font-semibold shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ListFilter className="h-3 w-3" /> Logs ({actionLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === "report"
                ? "bg-blue-600 text-white font-semibold shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Bug className="h-3 w-3" /> Bug Reports ({bugsFound.length})
          </button>
        </div>
      </div>

      {/* ── Main View Content Area ── */}
      <div className="relative flex-1 overflow-hidden bg-black/90">
        {/* Tab 1: Web View with Overlay Indicator */}
        {activeTab === "preview" && (
          <div className="relative h-full w-full">
            {/* Live Agent Banner */}
            {isRunning && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/90 border border-blue-500/50 shadow-2xl text-xs backdrop-blur animate-in fade-in duration-200">
                <Bot className="h-4 w-4 text-blue-400 animate-bounce" />
                <span className="text-zinc-200 font-medium">
                  {actionLogs[0]?.description || "AI Agent interacting with page..."}
                </span>
                {targetElementSelector && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] border border-blue-500/30">
                    Target: {targetElementSelector}
                  </span>
                )}
              </div>
            )}

            {/* Target Element Highlight Box Overlay */}
            {targetElementSelector && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <div className="h-28 w-64 rounded-xl border-2 border-dashed border-amber-400 bg-amber-400/10 shadow-2xl shadow-amber-400/20 animate-pulse flex items-center justify-center">
                  <span className="px-2 py-1 rounded bg-amber-950 text-amber-300 text-[10px] font-mono font-bold shadow border border-amber-500/40">
                    AI AGENT ACTION: {targetElementSelector}
                  </span>
                </div>
              </div>
            )}

            {/* Actual Webpage Iframe */}
            <iframe
              src={
                url.includes("localhost") || url.includes("127.0.0.1")
                  ? url
                  : `/api/browser-proxy?url=${encodeURIComponent(url)}`
              }
              title="AI Browser Preview"
              className="h-full w-full border-none bg-white"
            />
          </div>
        )}

        {/* Tab 2: Activity Logs Timeline */}
        {activeTab === "agent_logs" && (
          <div className="h-full overflow-y-auto p-4 space-y-3 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-400" /> AI Browser Action Logs
              </h3>
              <button
                onClick={clearLogs}
                className="text-[11px] text-zinc-500 hover:text-zinc-300"
              >
                Clear Logs
              </button>
            </div>

            <div className="space-y-2">
              {actionLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                    log.status === "error"
                      ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                      : log.status === "fixed"
                      ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-200"
                      : log.status === "success"
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5 uppercase font-mono text-[10px]">
                      {log.status === "error" && <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}
                      {log.status === "fixed" && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />}
                      {log.status === "success" && <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
                      [{log.type}]
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{log.timestamp}</span>
                  </div>

                  <p className="text-xs">{log.description}</p>

                  {log.codeSnippet && (
                    <pre className="mt-2 p-2 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-cyan-300 overflow-x-auto">
                      {log.codeSnippet}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Detailed Bug Reports */}
        {activeTab === "report" && (
          <div className="h-full overflow-y-auto p-4 space-y-4 font-sans">
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Bug className="h-4 w-4 text-rose-400" /> Automated Bug & Remediation Reports
            </h3>

            {bugsFound.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
                <p className="text-xs font-medium text-zinc-300">0 Bugs Reported</p>
                <p className="text-[11px] text-zinc-500">Run an Agent Test flow to scan for issues.</p>
              </div>
            ) : (
              bugsFound.map((bug) => (
                <div
                  key={bug.id}
                  className="p-4 rounded-xl bg-zinc-900/90 border border-rose-500/30 space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                        {bug.title}
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                          {bug.severity}
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">{bug.description}</p>
                    </div>

                    <span
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                        bug.status === "verified"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {bug.status === "verified" ? "VERIFIED FIXED ✅" : "DETECTED"}
                    </span>
                  </div>

                  {/* Affected File */}
                  {bug.affectedFile && (
                    <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono bg-zinc-950 p-2 rounded border border-zinc-800">
                      <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                      <span>File: {bug.affectedFile}</span>
                    </div>
                  )}

                  {/* Error Log */}
                  {bug.errorLog && (
                    <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/30 text-[11px] font-mono text-rose-300">
                      {bug.errorLog}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
