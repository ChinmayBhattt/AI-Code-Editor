"use client";

import { useChatStore } from "@/stores/chat-store";
import { useProjectStore } from "@/stores/project-store";
import { useEditorStore } from "@/stores/editor-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useAutomationStore } from "@/stores/automation-store";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { parseFileOperations, parseAutomationWorkflow } from "@/lib/ai/file-operations";
import { getLanguageFromPath } from "@/lib/utils";
import type { PendingChange } from "@/types/project";
import { ChatHistory } from "./chat-history";
import {
  Sparkles,
  Trash2,
  Loader2,
  Check,
  X,
  Plus,
  Clock,
  FileCode,
  ChevronDown,
  ChevronUp,
  Play,
  FileText,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";

export function ChatPanel() {
  const {
    messages,
    addMessage,
    isStreaming,
    setStreaming,
    setStreamingContent,
    clearMessages,
    setError,
    error,
    pendingChanges,
    setPendingChanges,
    clearPendingChanges,
    removePendingChange,
    sessions,
    historyOpen,
    startNewChat,
    toggleHistoryOpen,
  } = useChatStore();

  const { files, setFiles, projectName } = useProjectStore();
  const { activeTabId, tabs, openTab } = useEditorStore();
  const { apiKeys, aiConfig, updateAIConfig, addLog, toggleRightSidebar } = useSettingsStore();

  const [showPendingDropdown, setShowPendingDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasPlanMd = files.some((f) => f.path === "plan.md");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, pendingChanges]);

  // Write file directly to workspace/ disk folder
  const writeDiskFile = async (filePath: string, content: string, action = "write") => {
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, content, action }),
      });
    } catch {}
  };

  // Sync filesystem Explorer tree from workspace/
  const syncFilesystem = async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch {}
  };

  // Proceed from Plan Mode to Build Mode
  const handleProceedToBuild = async () => {
    updateAIConfig({ mode: "build" });
    addLog("Switching to Build Mode...", "info");
    await handleSendMessage("Proceed with building the project based on plan.md");
  };

  // Accept All Pending Changes
  const handleAcceptAll = async () => {
    for (const change of pendingChanges) {
      if (change.type === "create" || change.type === "edit") {
        await writeDiskFile(change.path, change.content);
        addLog(`Accepted & Saved: ${change.path}`, "success");
      } else if (change.type === "delete") {
        await writeDiskFile(change.path, "", "delete");
        addLog(`Accepted Delete: ${change.path}`, "warning");
      }
    }

    clearPendingChanges();
    await syncFilesystem();

    if (pendingChanges.length > 0) {
      const first = pendingChanges[0];
      openTab({
        id: first.path,
        fileId: first.path,
        path: first.path,
        name: first.path.split("/").pop() || first.path,
        language: getLanguageFromPath(first.path),
        content: first.content,
      });
    }
  };

  // Reject All Pending Changes
  const handleRejectAll = () => {
    clearPendingChanges();
    addLog("Rejected all AI file changes", "warning");
  };

  // Accept Single Change
  const handleAcceptSingle = async (change: PendingChange) => {
    await writeDiskFile(change.path, change.content);
    removePendingChange(change.id);
    await syncFilesystem();
    addLog(`Accepted: ${change.path}`, "success");
  };

  // Reject Single Change
  const handleRejectSingle = (id: string) => {
    removePendingChange(id);
  };

  const handleSendMessage = async (userPrompt: string) => {
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
      const activeTab = tabs.find((t) => t.id === activeTabId);
      const { isCanvasActive, getActiveWorkflow, applyGeneratedWorkflow } =
        useAutomationStore.getState();
      const { leftSidebarPanel } = useSettingsStore.getState();
      const isAutomationMode =
        isCanvasActive || leftSidebarPanel === "automations";
      const activeWorkflow = isAutomationMode ? getActiveWorkflow() : null;

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
          mode: aiConfig.mode,
          isAutomationMode,
          activeWorkflow,
          apiKeys,
          files: files.map((f) => ({
            path: f.path,
            content: f.content,
            language: f.language,
          })),
          activeFilePath: activeTab?.path,
          projectName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reach AI model");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      if (!fullContent.trim()) {
        fullContent = "Updated workflow / files based on your prompt.";
      }

      const assistantMessage = {
        id: crypto.randomUUID(),
        chatId: "default",
        role: "assistant" as const,
        content: fullContent,
        metadata: {},
        createdAt: new Date(),
      };
      addMessage(assistantMessage);
      setStreamingContent("");

      // ── 1. Check for Automation Workflow parsing ──
      const automationData = parseAutomationWorkflow(fullContent);
      if (automationData) {
        applyGeneratedWorkflow(automationData);
        addLog(
          `AI generated workflow with ${automationData.nodes.length} nodes on canvas`,
          "success"
        );
      }

      // ── 2. Check for File Operations parsing ──
      // If in automation mode, only create files if explicitly marked create: or edit:
      const ops = parseFileOperations(fullContent);
      const isExplicitFileOp = /```(create|edit|delete):/i.test(fullContent);

      if (!isAutomationMode || isExplicitFileOp) {
        const newPending: PendingChange[] = [];
        for (const op of ops) {
          if ((op.type === "create" || op.type === "edit") && op.content) {
            const existing = files.find((f) => f.path === op.path);
            const originalContent = existing?.content || "";
            const newContent = op.content;

            newPending.push({
              id: crypto.randomUUID(),
              path: op.path,
              type:
                (op.type as string) === "delete"
                  ? "delete"
                  : existing
                  ? "edit"
                  : "create",
              content: newContent,
              originalContent,
              additions: newContent.split("\n").length,
              deletions: originalContent ? originalContent.split("\n").length : 0,
            });

            // Open tab so inline diff highlights show up in Monaco Editor
            openTab({
              id: op.path,
              fileId: op.path,
              path: op.path,
              name: op.path.split("/").pop() || op.path,
              language: getLanguageFromPath(op.path),
              content: newContent,
            });

            addLog(`AI Proposed Edit: ${op.path}`, "info");
          }
        }

        if (newPending.length > 0) {
          setPendingChanges(newPending);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      addLog(`AI Error: ${error.message}`, "error");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#141417] text-zinc-300 relative">
      {/* Header Toolbar */}
      <div className="flex h-9 items-center justify-between border-b border-zinc-800 px-3 text-xs font-semibold shrink-0 bg-zinc-900/60">
        <div className="flex items-center gap-1.5 text-zinc-200">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>Agent</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wider font-mono font-bold ${
              aiConfig.mode === "plan"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}
          >
            {aiConfig.mode}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {/* New Chat (+) Button */}
          <button
            onClick={startNewChat}
            title="New Chat (+)"
            className="rounded p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* History Button */}
          <button
            onClick={toggleHistoryOpen}
            title="Chat History"
            className={`relative rounded p-1.5 hover:bg-zinc-800 transition-colors ${
              historyOpen ? "bg-zinc-800 text-indigo-400" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Clock className="h-4 w-4" />
            {sessions.length > 0 && (
              <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
            )}
          </button>

          {/* Clear Current Messages Button */}
          <button
            onClick={clearMessages}
            title="Clear Chat"
            className="rounded p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Close Panel Button */}
          <button
            onClick={toggleRightSidebar}
            title="Close Assistant Panel"
            className="rounded p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat History Overlay */}
      {historyOpen && <ChatHistory />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-zinc-500 space-y-2">
            <Sparkles className="h-8 w-8 text-indigo-500/40" />
            <p className="text-xs font-medium text-zinc-400">AI Coding Assistant</p>
            <p className="text-[11px] text-zinc-500 max-w-[220px]">
              Ask me to build apps, create plan.md, or edit code. Switch between Plan & Build mode below.
            </p>
          </div>
        )}

        {messages.map((m, idx) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            isLastAssistantMessage={idx === messages.length - 1 && m.role === "assistant"}
            onProceed={handleProceedToBuild}
          />
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 p-2 rounded bg-indigo-500/10 border border-indigo-500/20">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>AI is analyzing project and generating content...</span>
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Proceed to Build Banner (When plan.md is present in Plan Mode) ── */}
      {aiConfig.mode === "plan" && hasPlanMd && !isStreaming && (
        <div className="border-t border-indigo-500/30 bg-indigo-950/40 p-2.5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-indigo-200 font-medium">
            <FileText className="h-4 w-4 text-indigo-400" />
            <span>Plan Ready in plan.md</span>
          </div>
          <button
            onClick={handleProceedToBuild}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg transition-colors"
          >
            <Play className="h-3.5 w-3.5" /> Proceed to Build
          </button>
        </div>
      )}

      {/* ── Pending Changes Approval Bar ── */}
      {pendingChanges.length > 0 && (
        <div className="border-t border-zinc-800 bg-zinc-900/95 p-2.5 backdrop-blur shrink-0 space-y-2">
          {showPendingDropdown && (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pb-2 border-b border-zinc-800/80">
              {pendingChanges.map((change) => (
                <div
                  key={change.id}
                  className="flex items-center justify-between p-1.5 rounded bg-zinc-950/60 border border-zinc-800 text-[11px] font-mono"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="text-emerald-400">+{change.additions}</span>
                      <span className="text-rose-400">-{change.deletions}</span>
                    </span>
                    <span className="truncate text-zinc-200">{change.path}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleAcceptSingle(change)}
                      className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400"
                      title="Accept file change"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleRejectSingle(change.id)}
                      className="p-1 rounded hover:bg-rose-500/20 text-rose-400"
                      title="Reject file change"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowPendingDropdown(!showPendingDropdown)}
              className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium hover:text-white"
            >
              <FileCode className="h-4 w-4 text-blue-400" />
              <span>{pendingChanges.length} Files With Changes</span>
              {showPendingDropdown ? (
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRejectAll}
                className="px-3 py-1 rounded text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                Reject all
              </button>

              <button
                onClick={handleAcceptAll}
                className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
    </div>
  );
}
