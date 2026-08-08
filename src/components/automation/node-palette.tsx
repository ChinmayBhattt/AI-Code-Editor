"use client";

import { useState } from "react";
import { useAutomationStore } from "@/stores/automation-store";
import { NODE_TEMPLATES, NODE_TYPE_COLORS } from "@/types/automation";
import type { NodeTemplate } from "@/types/automation";
import {
  X,
  Search,
  Plus,
  Webhook,
  Clock,
  Play,
  Eye,
  Globe,
  Mail,
  FileText,
  Database,
  MessageSquare,
  GitBranch,
  ToggleLeft,
  Sparkles,
  Bot,
  FileSearch,
  Code,
  Terminal,
  Shuffle,
  Monitor,
  Save,
  Zap,
  ChevronRight,
} from "lucide-react";

function getIconComponent(label: string): React.ComponentType<{ className?: string }> {
  if (label.includes("Webhook")) return Webhook;
  if (label.includes("Schedule")) return Clock;
  if (label.includes("Manual")) return Play;
  if (label.includes("File Watcher")) return Eye;
  if (label.includes("HTTP")) return Globe;
  if (label.includes("Email")) return Mail;
  if (label.includes("Read") || label.includes("Write")) return FileText;
  if (label.includes("Database")) return Database;
  if (label.includes("Slack")) return MessageSquare;
  if (label.includes("If") || label.includes("Else")) return GitBranch;
  if (label.includes("Switch")) return ToggleLeft;
  if (label.includes("Text Generator") || label.includes("Summarizer")) return Sparkles;
  if (label.includes("Code Reviewer")) return Bot;
  if (label.includes("JavaScript") || label.includes("Transform")) return Code;
  if (label.includes("Python")) return Terminal;
  if (label.includes("Console")) return Monitor;
  if (label.includes("Save")) return Save;
  return Zap;
}

export function NodePalette() {
  const { addNode, setPaletteOpen } = useAutomationStore();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Group templates by category
  const categories = NODE_TEMPLATES.reduce(
    (acc, template) => {
      if (!acc[template.category]) acc[template.category] = [];
      acc[template.category].push(template);
      return acc;
    },
    {} as Record<string, NodeTemplate[]>
  );

  const categoryOrder = ["Triggers", "Actions", "Logic", "AI", "Code", "Output"];

  const filteredCategories = Object.fromEntries(
    Object.entries(categories)
      .map(([cat, templates]) => [
        cat,
        templates.filter(
          (t) =>
            t.label.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase())
        ),
      ])
      .filter(([, templates]) => (templates as NodeTemplate[]).length > 0)
  );

  const handleAddNode = (template: NodeTemplate) => {
    // Place at a slightly randomized center position
    const x = 300 + Math.random() * 200;
    const y = 150 + Math.random() * 200;
    addNode(template, x, y);
  };

  const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    Triggers: Zap,
    Actions: Globe,
    Logic: GitBranch,
    AI: Sparkles,
    Code: Code,
    Output: Monitor,
  };

  const categoryColors: Record<string, string> = {
    Triggers: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    Actions: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    Logic: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    AI: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    Code: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Output: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#111114] border-r border-zinc-800/80 z-40 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Plus className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-200">Add Node</span>
        </div>
        <button
          onClick={() => setPaletteOpen(false)}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="w-full rounded bg-zinc-900/80 border border-zinc-800 pl-7 pr-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
        {categoryOrder.map((cat) => {
          const templates = filteredCategories[cat];
          if (!templates || templates.length === 0) return null;
          const CatIcon = categoryIcons[cat] || Zap;
          const isExpanded = activeCategory === cat || search.length > 0;
          const colorClass = categoryColors[cat] || "text-zinc-400 bg-zinc-800/40 border-zinc-700/40";

          return (
            <div key={cat}>
              <button
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800/60 transition-colors"
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded border ${colorClass}`}>
                  <CatIcon className="h-2.5 w-2.5" />
                </div>
                <span className="flex-1 text-left">{cat}</span>
                <span className="text-[10px] text-zinc-600">{(templates as NodeTemplate[]).length}</span>
                <ChevronRight
                  className={`h-3 w-3 text-zinc-600 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="ml-2 mt-1 space-y-0.5">
                  {(templates as NodeTemplate[]).map((template) => {
                    const Icon = getIconComponent(template.label);
                    const colors = NODE_TYPE_COLORS[template.type];

                    return (
                      <button
                        key={`${template.type}-${template.label}`}
                        onClick={() => handleAddNode(template)}
                        className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left transition-all hover:bg-zinc-800/80 group border border-transparent hover:border-zinc-700/60`}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg ${colors.bg} ${colors.border} border shrink-0`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${colors.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-zinc-300 group-hover:text-zinc-100 truncate">
                            {template.label}
                          </p>
                          <p className="text-[9px] text-zinc-600 truncate">
                            {template.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

