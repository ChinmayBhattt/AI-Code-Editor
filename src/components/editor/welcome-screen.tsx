"use client";

import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";
import { Sparkles, Code2, FolderPlus, Terminal, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WelcomeScreen() {
  const { projectName, files } = useProjectStore();
  const { setSettingsDialogOpen } = useSettingsStore();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#1e1e1e] p-8 text-center text-zinc-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            AI Code Studio
          </h1>
          <p className="text-xs text-zinc-400">Browser-Based Autonomous AI IDE</p>
        </div>
      </div>

      <div className="max-w-md w-full space-y-4 mb-8">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-blue-400" />
            {projectName ? `Current Project: ${projectName}` : "No Project Active"}
          </h2>
          <p className="text-xs text-zinc-400">
            {files.length > 0
              ? `${files.length} files in workspace. Click a file in the sidebar or prompt the AI to begin.`
              : "Use the AI Assistant on the right to generate apps, features, components, and entire backends."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md w-full">
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3 text-left hover:border-zinc-700 transition-colors">
          <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> AI Generation
          </p>
          <p className="text-[11px] text-zinc-400">Type natural language prompts on the right panel.</p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3 text-left hover:border-zinc-700 transition-colors">
          <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-1">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" /> Instant Execution
          </p>
          <p className="text-[11px] text-zinc-400">AI automatically creates, edits, and refactors files.</p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSettingsDialogOpen(true)}
          className="border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white gap-2"
        >
          <Settings className="h-4 w-4 text-zinc-400" /> API Key Settings
        </Button>
      </div>
    </div>
  );
}
