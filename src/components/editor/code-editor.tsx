"use client";

import Editor from "@monaco-editor/react";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useChatStore } from "@/stores/chat-store";
import { Loader2, Check, X, Sparkles } from "lucide-react";
import { useEffect } from "react";

interface CodeEditorProps {
  fileId: string;
  path: string;
  content: string;
  language: string;
}

export function CodeEditor({ fileId, path, content, language }: CodeEditorProps) {
  const { settings, updateTabContent, setCursorPosition, markTabClean } = useEditorStore();
  const { updateFileContent, setFiles } = useProjectStore();
  const { appSettings, addLog } = useSettingsStore();
  const { pendingChanges, removePendingChange } = useChatStore();

  const pendingForThisFile = pendingChanges.find((c) => c.path === path);

  const writeDiskFile = async (filePath: string, fileContent: string) => {
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, content: fileContent }),
      });
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.files) setFiles(data.files);
    } catch {}
  };

  const handleAccept = async () => {
    if (!pendingForThisFile) return;
    updateTabContent(fileId, pendingForThisFile.content);
    updateFileContent(fileId, pendingForThisFile.content);
    await writeDiskFile(path, pendingForThisFile.content);
    removePendingChange(pendingForThisFile.id);
    addLog(`Accepted changes for ${path}`, "success");
  };

  const handleReject = () => {
    if (!pendingForThisFile) return;
    removePendingChange(pendingForThisFile.id);
    addLog(`Rejected changes for ${path}`, "warning");
  };

  // Global Keyboard listener for Cmd+S (Save), Cmd+Enter (Accept), Cmd+Backspace (Reject)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        updateFileContent(fileId, content);
        writeDiskFile(path, content);
        markTabClean(fileId);
        addLog(`Saved: ${path}`, "info");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && pendingForThisFile) {
        e.preventDefault();
        handleAccept();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Backspace" && pendingForThisFile) {
        e.preventDefault();
        handleReject();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingForThisFile, content, fileId, path]);

  const handleChange = (value: string | undefined) => {
    const newContent = value ?? "";
    updateTabContent(fileId, newContent);
    if (appSettings.autoSave) {
      updateFileContent(fileId, newContent);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={language}
        value={pendingForThisFile ? pendingForThisFile.content : content}
        theme={settings.theme}
        loading={
          <div className="flex h-full w-full items-center justify-center bg-[#1e1e1e] text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-indigo-400" />
            <span className="text-xs font-mono">Initializing Editor...</span>
          </div>
        }
        onChange={handleChange}
        onMount={(editor) => {
          editor.onDidChangeCursorPosition((e) => {
            setCursorPosition(fileId, {
              lineNumber: e.position.lineNumber,
              column: e.position.column,
            });
          });
        }}
        options={{
          fontSize: settings.fontSize,
          minimap: { enabled: settings.minimap },
          wordWrap: settings.wordWrap,
          lineNumbers: settings.lineNumbers,
          tabSize: settings.tabSize,
          smoothScrolling: settings.smoothScrolling,
          cursorBlinking: settings.cursorBlinking,
          cursorSmoothCaretAnimation: settings.cursorSmoothCaretAnimation,
          renderWhitespace: settings.renderWhitespace,
          automaticLayout: true,
          selectOnLineNumbers: true,
          multiCursorModifier: "alt",
          contextmenu: true,
          quickSuggestions: true,
          padding: { top: 12, bottom: 48 },
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          fontLigatures: true,
          scrollBeyondLastLine: false,
        }}
      />

      {/* Floating In-Editor Accept / Reject Bar */}
      {pendingForThisFile && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700/80 shadow-2xl backdrop-blur select-none animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 mr-2 font-medium">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>AI Code Suggestion</span>
          </div>

          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <Check className="h-3.5 w-3.5" /> Accept <span className="text-[10px] text-blue-200 font-normal">⌘↵</span>
          </button>

          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Reject <span className="text-[10px] text-zinc-500 font-normal">⌘⌫</span>
          </button>
        </div>
      )}
    </div>
  );
}
