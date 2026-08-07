"use client";

import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useChatStore } from "@/stores/chat-store";
import { executeCode } from "@/lib/execution/runner";
import { getLanguageFromPath } from "@/lib/utils";
import {
  X,
  FileCode,
  Circle,
  Play,
  Globe,
  Save,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EditorTabs() {
  const { tabs, activeTabId, switchTab, closeTab, markTabClean, openTab } = useEditorStore();
  const { files, updateFileContent, setFiles } = useProjectStore();
  const {
    toggleLiveServer,
    liveServerOpen,
    addConsoleOutput,
    setBottomPanelTab,
    updateAIConfig,
    aiConfig,
    apiKeys,
    addLog,
  } = useSettingsStore();

  const { addMessage, setStreaming, messages, setError } = useChatStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isPlanMdActive = activeTab?.name === "plan.md";

  const handleRunCode = () => {
    if (!activeTab) return;
    const targetFile = files.find((f) => f.id === activeTab.fileId);
    if (!targetFile) return;

    updateFileContent(activeTab.fileId, activeTab.content);
    markTabClean(activeTab.id);
    setBottomPanelTab("console");

    const res = executeCode(targetFile.name, activeTab.content, activeTab.language);
    addConsoleOutput(
      `$ Executing ${targetFile.name} (${res.executionTimeMs}ms)\n${res.output}`,
      res.success ? "log" : "error"
    );
  };

  const handleSaveFile = () => {
    if (!activeTab) return;
    updateFileContent(activeTab.fileId, activeTab.content);
    markTabClean(activeTab.id);
  };

  const handleProceedToBuild = async () => {
    updateAIConfig({ mode: "build" });
    addLog("Switching to Build Mode...", "info");

    const userPrompt = "Proceed with building the project based on plan.md";
    const userMessage = {
      id: crypto.randomUUID(),
      chatId: "default",
      role: "user" as const,
      content: userPrompt,
      metadata: {},
      createdAt: new Date(),
    };
    addMessage(userMessage);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          provider: aiConfig.provider,
          modelId: aiConfig.modelId,
          mode: "build",
          apiKeys,
          files: files.map((f) => ({
            path: f.path,
            content: f.content,
            language: f.language,
          })),
          activeFilePath: activeTab?.path,
        }),
      });

      if (!res.ok) throw new Error("Build request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContent += decoder.decode(value, { stream: true });
      }

      addMessage({
        id: crypto.randomUUID(),
        chatId: "default",
        role: "assistant",
        content: fullContent,
        metadata: {},
        createdAt: new Date(),
      });

      // Write files and sync
      const resFiles = await fetch("/api/files");
      const dataFiles = await resFiles.json();
      if (dataFiles.files) setFiles(dataFiles.files);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex h-10 w-full items-center justify-between bg-[#18181b] border-b border-zinc-800 px-2 overflow-x-auto scrollbar-none select-none">
      {/* Open File Tabs */}
      <div className="flex items-center h-full overflow-x-auto scrollbar-none">
        {tabs.length === 0 ? (
          <span className="text-xs text-zinc-500 italic px-2">No file open</span>
        ) : (
          tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={cn(
                  "group flex h-full items-center gap-2 border-r border-zinc-800/60 px-3 text-xs cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
                  isActive
                    ? "bg-[#1e1e1e] text-zinc-100 border-t-2 border-t-blue-500 font-medium"
                    : "bg-[#18181b] text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                )}
              >
                {tab.name === "plan.md" ? (
                  <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                ) : (
                  <FileCode className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                )}
                <span className="truncate flex-1">{tab.name}</span>

                {tab.isDirty ? (
                  <Circle className="h-2 w-2 fill-blue-400 text-blue-400 shrink-0 group-hover:hidden" />
                ) : null}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className={cn(
                    "rounded p-0.5 hover:bg-zinc-700/60 hover:text-zinc-100 shrink-0",
                    tab.isDirty ? "hidden group-hover:block" : "opacity-60 group-hover:opacity-100"
                  )}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        {/* Prominent Proceed to Build button if plan.md is open */}
        {isPlanMdActive && (
          <Button
            onClick={handleProceedToBuild}
            size="sm"
            className="h-7 px-3 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Proceed to Build</span>
          </Button>
        )}

        {activeTab && !isPlanMdActive && (
          <Button
            onClick={handleSaveFile}
            size="sm"
            variant="ghost"
            title="Save File (Cmd+S)"
            className="h-7 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        )}

        {activeTab && !isPlanMdActive && (
          <Button
            onClick={handleRunCode}
            size="sm"
            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1.5 shadow-sm shadow-emerald-600/20"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run Code</span>
          </Button>
        )}

        <Button
          onClick={toggleLiveServer}
          size="sm"
          variant="outline"
          className={cn(
            "h-7 px-2.5 text-xs border-zinc-700 text-zinc-200 hover:bg-zinc-800 gap-1.5",
            liveServerOpen ? "bg-blue-600/20 border-blue-500/40 text-blue-400 font-semibold" : "bg-zinc-900"
          )}
        >
          <Globe className="h-3.5 w-3.5 text-blue-400" />
          <span>Open Live Server</span>
        </Button>
      </div>
    </div>
  );
}
