"use client";

import { useState, useEffect } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { useEditorStore } from "@/stores/editor-store";
import { useAutomationStore } from "@/stores/automation-store";
import { MainHeader } from "@/components/header/main-header";
import { SidebarNav } from "@/components/sidebar/sidebar";
import { FileExplorer } from "@/components/sidebar/file-explorer";
import { SearchPanel } from "@/components/sidebar/search-panel";
import { ProjectPanel } from "@/components/sidebar/project-panel";
import { AutomationsPanel } from "@/components/sidebar/automations-panel";
import { EditorTabs } from "@/components/editor/editor-tabs";
import { CodeEditor } from "@/components/editor/code-editor";
import { WelcomeScreen } from "@/components/editor/welcome-screen";
import { LiveServerPreview } from "@/components/preview/live-server";
import { ChatPanel } from "@/components/ai-chat/chat-panel";
import { BottomPanel } from "@/components/panel/bottom-panel";
import { StatusBar } from "@/components/status-bar/status-bar";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { WorkflowCanvas } from "@/components/automation/workflow-canvas";
import { AIBrowserPanel } from "@/components/browser/ai-browser-panel";
import { useBrowserAgentStore } from "@/stores/browser-agent-store";
import { GripVertical, GripHorizontal } from "lucide-react";

export default function IDEMainPage() {
  const { leftSidebarOpen, leftSidebarPanel, rightSidebarOpen, toggleRightSidebar, liveServerOpen, bottomPanelOpen } =
    useSettingsStore();
  const { activeTabId, tabs } = useEditorStore();
  const { isCanvasActive } = useAutomationStore();
  const { isOpen: browserIsOpen, isFullScreen: isBrowserFullScreen } = useBrowserAgentStore();

  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(320);
  const [bottomHeight, setBottomHeight] = useState(220);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    try {
      localStorage.removeItem("ai-code-studio-layout");
      localStorage.removeItem("react-resizable-panels:ai-code-studio-layout");
    } catch { }
  }, []);

  // Drag Left Handle
  const handleLeftMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setLeftWidth(Math.max(160, Math.min(480, startWidth + delta)));
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Drag Right Handle
  const handleRightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      setRightWidth(Math.max(220, Math.min(550, startWidth + delta)));
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Drag Bottom Handle
  const handleBottomMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = bottomHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      setBottomHeight(Math.max(100, Math.min(500, startHeight + delta)));
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0f0f11] overflow-hidden select-none">
      {/* VS Code Main Menu Header */}
      <MainHeader />

      {/* Main IDE Row */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Navigation Rail (fixed 48px) */}
        <SidebarNav />

        {/* ── 1. Left Sidebar (Resizable) ── */}
        {leftSidebarOpen && (
          <div
            style={{ width: `${leftWidth}px` }}
            className="h-full bg-[#18181b] flex flex-col shrink-0 overflow-hidden relative border-r border-zinc-800/80"
          >
            {leftSidebarPanel === "explorer" && <FileExplorer />}
            {leftSidebarPanel === "search" && <SearchPanel />}
            {leftSidebarPanel === "projects" && <ProjectPanel />}
            {leftSidebarPanel === "automations" && <AutomationsPanel />}
          </div>
        )}

        {/* Left Resizer Drag Handle */}
        {leftSidebarOpen && (
          <div
            onMouseDown={handleLeftMouseDown}
            className="w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 bg-transparent transition-colors z-10 shrink-0 flex items-center justify-center group"
          >
            <GripVertical className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* ── 2. Center Area (Editor + Live Server + Bottom Panel) ── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1e1e1e]">

          {/* Top Half: Canvas OR Editor + Live Server */}
          <div className="flex-1 flex overflow-hidden relative">
            {isCanvasActive ? (
              /* ── Workflow Canvas (replaces editor) ── */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <WorkflowCanvas />
              </div>
            ) : browserIsOpen && isBrowserFullScreen ? (
              /* ── Fullscreen AI Browser Agent (replaces editor) ── */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <AIBrowserPanel />
              </div>
            ) : (
              <>
                {/* Monaco Editor */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <EditorTabs />
                  <div className="flex-1 overflow-hidden relative">
                    {activeTab ? (
                      <CodeEditor
                        key={activeTab.id}
                        fileId={activeTab.fileId}
                        path={activeTab.path}
                        content={activeTab.content}
                        language={activeTab.language}
                      />
                    ) : (
                      <WelcomeScreen />
                    )}
                  </div>
                </div>

                {/* Live Web Server Preview */}
                {liveServerOpen && !browserIsOpen && (
                  <div className="w-1/2 h-full border-l border-zinc-800/80 flex flex-col shrink-0">
                    <LiveServerPreview />
                  </div>
                )}

                {/* AI Browser Agent Panel (Split View) */}
                {browserIsOpen && !isBrowserFullScreen && (
                  <div className="w-1/2 h-full border-l border-zinc-800/80 flex flex-col shrink-0">
                    <AIBrowserPanel />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Resizer Drag Handle */}
          {bottomPanelOpen && (
            <div
              onMouseDown={handleBottomMouseDown}
              className="h-1.5 w-full cursor-row-resize hover:bg-blue-500/50 active:bg-blue-500 bg-transparent transition-colors z-10 shrink-0 flex items-center justify-center group"
            >
              <GripHorizontal className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          {/* Resizable Bottom Terminal / Console Panel */}
          {bottomPanelOpen && (
            <div
              style={{ height: `${bottomHeight}px` }}
              className="w-full shrink-0 overflow-hidden"
            >
              <BottomPanel />
            </div>
          )}
        </div>

        {/* Right Resizer Drag Handle */}
        {rightSidebarOpen && (
          <div
            onMouseDown={handleRightMouseDown}
            className="w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 bg-transparent transition-colors z-10 shrink-0 flex items-center justify-center group"
          >
            <GripVertical className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* ── 3. Right AI Assistant Sidebar ── */}
        {rightSidebarOpen && (
          <div
            style={{ width: `${rightWidth}px` }}
            className="h-full bg-[#141417] flex flex-col shrink-0 overflow-hidden border-l border-zinc-800/80"
          >
            <ChatPanel />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Settings Modal */}
      <SettingsDialog />
    </div>
  );
}
