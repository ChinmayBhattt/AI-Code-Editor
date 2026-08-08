"use client";

import { useSettingsStore } from "@/stores/settings-store";
import { useBrowserAgentStore } from "@/stores/browser-agent-store";
import { FolderTree, FolderGit2, Search, Settings, Zap, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const { leftSidebarPanel, setLeftSidebarPanel, setSettingsDialogOpen } = useSettingsStore();
  const { setIsOpen: setBrowserIsOpen, isOpen: browserIsOpen } = useBrowserAgentStore();

  const items = [
    { id: "explorer", label: "File Explorer", icon: FolderTree },
    { id: "search", label: "Search Code", icon: Search },
    { id: "projects", label: "Projects", icon: FolderGit2 },
    { id: "automations", label: "Automations", icon: Zap },
  ] as const;

  return (
    <div className="flex h-full w-12 flex-col items-center justify-between bg-[#141417] border-r border-zinc-800 py-3 shrink-0 select-none">
      <div className="flex flex-col items-center gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = leftSidebarPanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setLeftSidebarPanel(item.id)}
              title={item.label}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}

        {/* AI Browser Agent Icon */}
        <button
          onClick={() => setBrowserIsOpen(!browserIsOpen)}
          title="AI Browser Agent"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
            browserIsOpen
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
          )}
        >
          <Globe className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={() => setSettingsDialogOpen(true)}
        title="Settings & API Keys"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 transition-all"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}
