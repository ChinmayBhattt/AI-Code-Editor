"use client";

import { useSettingsStore } from "@/stores/settings-store";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { Cpu, Terminal, CheckCircle2, GitBranch } from "lucide-react";

export function StatusBar() {
  const { aiConfig, toggleBottomPanel } = useSettingsStore();
  const { tabs, activeTabId } = useEditorStore();
  const { files, projectName } = useProjectStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex h-6 w-full items-center justify-between bg-[#0f0f11] border-t border-zinc-800/80 px-3 text-[11px] text-zinc-400 select-none">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 text-zinc-300 font-medium">
          <GitBranch className="h-3 w-3 text-blue-400" /> main
        </span>

        <span className="flex items-center gap-1 text-zinc-400">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {projectName || "Workspace"} ({files.length} files)
        </span>

        {activeTab && (
          <span className="text-zinc-300">
            {activeTab.name} — Ln {activeTab.cursorPosition?.lineNumber || 1}, Col{" "}
            {activeTab.cursorPosition?.column || 1}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleBottomPanel}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
        >
          <Terminal className="h-3 w-3 text-emerald-400" /> Terminal
        </button>

        <span className="flex items-center gap-1 text-indigo-400 font-mono">
          <Cpu className="h-3 w-3" /> {aiConfig.provider.toUpperCase()}: {aiConfig.modelId}
        </span>
      </div>
    </div>
  );
}
