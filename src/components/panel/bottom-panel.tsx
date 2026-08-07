"use client";

import { useSettingsStore } from "@/stores/settings-store";
import { RealTerminal } from "./terminal";
import { Terminal, Bug, FileText, Trash2, X, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomPanel() {
  const {
    bottomPanelOpen,
    toggleBottomPanel,
    bottomPanelTab,
    setBottomPanelTab,
    logs,
    errors,
    consoleOutputs,
    clearLogs,
    clearErrors,
    clearConsole,
  } = useSettingsStore();

  if (!bottomPanelOpen) return null;

  return (
    <div className="flex h-full w-full flex-col bg-[#141417] border-t border-zinc-800 text-xs text-zinc-300 select-none overflow-hidden">
      {/* Header Tabs */}
      <div className="flex h-8 items-center justify-between border-b border-zinc-800 px-3 bg-[#18181b] shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBottomPanelTab("console")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
              bottomPanelTab === "console"
                ? "bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Play className="h-3.5 w-3.5 text-emerald-400" /> Output Console ({consoleOutputs.length})
          </button>

          <button
            onClick={() => setBottomPanelTab("terminal")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
              bottomPanelTab === "terminal"
                ? "bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Terminal className="h-3.5 w-3.5 text-blue-400" /> Interactive Terminal
          </button>

          <button
            onClick={() => setBottomPanelTab("logs")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
              bottomPanelTab === "logs"
                ? "bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <FileText className="h-3.5 w-3.5 text-amber-400" /> AI Logs ({logs.length})
          </button>

          <button
            onClick={() => setBottomPanelTab("errors")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
              bottomPanelTab === "errors"
                ? "bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Bug className="h-3.5 w-3.5 text-rose-400" /> Errors ({errors.length})
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={
              bottomPanelTab === "console"
                ? clearConsole
                : bottomPanelTab === "logs"
                ? clearLogs
                : clearErrors
            }
            title="Clear Output"
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={toggleBottomPanel}
            title="Hide Panel"
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto font-mono text-[11px]">
        {bottomPanelTab === "console" && (
          <div className="p-3 space-y-1.5">
            {consoleOutputs.length === 0 ? (
              <p className="text-zinc-500">Output console is clear. Click "▶ Run Code" to execute active file.</p>
            ) : (
              consoleOutputs.map((item) => (
                <div
                  key={item.id}
                  className={`whitespace-pre-wrap leading-relaxed ${
                    item.type === "system"
                      ? "text-emerald-400"
                      : item.type === "error"
                      ? "text-rose-400"
                      : item.type === "warn"
                      ? "text-amber-400"
                      : "text-zinc-200"
                  }`}
                >
                  <span className="text-zinc-600 mr-2" suppressHydrationWarning>
                    [{new Date(item.timestamp).toLocaleTimeString()}]
                  </span>
                  {item.message}
                </div>
              ))
            )}
          </div>
        )}

        {bottomPanelTab === "terminal" && <RealTerminal />}

        {bottomPanelTab === "logs" && (
          <div className="p-3 space-y-1">
            {logs.length === 0 ? (
              <p className="text-zinc-500">No activity logs recorded.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center gap-2">
                  <span className="text-zinc-600" suppressHydrationWarning>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={
                      log.type === "success"
                        ? "text-emerald-400"
                        : log.type === "error"
                        ? "text-rose-400"
                        : log.type === "warning"
                        ? "text-amber-400"
                        : "text-zinc-300"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {bottomPanelTab === "errors" && (
          <div className="p-3 space-y-1">
            {errors.length === 0 ? (
              <p className="text-zinc-500">No runtime errors detected.</p>
            ) : (
              errors.map((err) => (
                <div key={err.id} className="text-rose-400" suppressHydrationWarning>
                  [{new Date(err.timestamp).toLocaleTimeString()}] {err.message}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
