"use client";

import Editor from "@monaco-editor/react";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useChatStore } from "@/stores/chat-store";
import { Loader2, Check, X, Sparkles, FileCode } from "lucide-react";
import { useEffect, useRef } from "react";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

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
    // Restore original content if available
    if (pendingForThisFile.originalContent) {
      updateTabContent(fileId, pendingForThisFile.originalContent);
    }
    removePendingChange(pendingForThisFile.id);
    addLog(`Rejected changes for ${path}`, "warning");
  };

  // Apply green/red line diff decorations in Monaco Editor
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) return;

    if (pendingForThisFile) {
      const origLines = (pendingForThisFile.originalContent || "").split("\n");
      const newLines = (pendingForThisFile.content || "").split("\n");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newDecorations: any[] = [];

      newLines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const origLine = origLines[idx];

        if (origLine === undefined || origLine !== line) {
          // Added or modified line -> Green diff highlight!
          newDecorations.push({
            range: new monaco.Range(lineNum, 1, lineNum, Math.max(1, line.length + 1)),
            options: {
              isWholeLine: true,
              className: "monaco-diff-line-added",
              linesDecorationsClassName: "monaco-diff-gutter-added",
            },
          });
        }
      });

      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    } else {
      if (decorationsRef.current.length > 0) {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      }
    }
  }, [pendingForThisFile, content]);

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
      {/* Top Floating Action Lens Bar for Inline Accept / Reject */}
      {pendingForThisFile && (
        <div className="absolute top-2 right-6 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/95 border border-zinc-700/80 shadow-2xl backdrop-blur select-none animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium mr-1">
            <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>AI Code Edits</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono">
              +{pendingForThisFile.additions || 1} lines
            </span>
          </div>

          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Check className="h-3.5 w-3.5" /> Accept <span className="text-[10px] text-emerald-100 font-mono">⌘↵</span>
          </button>

          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 hover:text-white text-xs transition-colors"
          >
            <X className="h-3.5 w-3.5 text-rose-400" /> Reject <span className="text-[10px] text-rose-400 font-mono">⌘⌫</span>
          </button>
        </div>
      )}

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
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;

          editor.onDidChangeCursorPosition((e: { position: { lineNumber: number; column: number } }) => {
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
    </div>
  );
}
