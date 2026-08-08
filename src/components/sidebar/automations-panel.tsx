"use client";

import { useState } from "react";
import { useAutomationStore } from "@/stores/automation-store";
import {
  Zap,
  Plus,
  Trash2,
  Search,
  ChevronRight,
  Workflow,
  Clock,
  MoreVertical,
  Edit3,
  Check,
  X,
} from "lucide-react";

export function AutomationsPanel() {
  const {
    workflows,
    activeWorkflowId,
    createWorkflow,
    deleteWorkflow,
    loadWorkflow,
    renameWorkflow,
  } = useAutomationStore();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleConfirmRename = (id: string) => {
    if (editName.trim()) {
      renameWorkflow(id, editName.trim());
    }
    setEditingId(null);
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex h-full flex-col text-zinc-300">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          Automations
        </div>
        <button
          onClick={() => createWorkflow()}
          title="New Automation"
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows..."
            className="w-full rounded bg-zinc-900/80 border border-zinc-800 pl-7 pr-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Workflow List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 mb-3">
              <Workflow className="h-5 w-5 text-amber-500/50" />
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">No automations yet</p>
            <p className="text-[10px] text-zinc-600 mt-0.5 max-w-[160px]">
              Create your first automation workflow to get started
            </p>
          </div>
        ) : (
          filtered.map((workflow) => {
            const isActive = workflow.id === activeWorkflowId;
            const isEditing = editingId === workflow.id;

            return (
              <div
                key={workflow.id}
                className={`group rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? "bg-amber-500/10 border-amber-500/30 shadow-sm shadow-amber-500/10"
                    : "bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/60 hover:border-zinc-700/60"
                }`}
              >
                <div
                  onClick={() => !isEditing && loadWorkflow(workflow.id)}
                  className="flex items-center gap-2 px-3 py-2.5"
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                      isActive
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-zinc-800/80 text-zinc-500 group-hover:text-zinc-400"
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleConfirmRename(workflow.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="w-full rounded bg-zinc-900 border border-amber-500/40 px-1.5 py-0.5 text-xs text-zinc-200 outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmRename(workflow.id);
                          }}
                          className="p-0.5 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="p-0.5 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <p
                        className={`text-xs font-medium truncate ${
                          isActive ? "text-amber-200" : "text-zinc-300"
                        }`}
                      >
                        {workflow.name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                        <Workflow className="h-2.5 w-2.5" />
                        {workflow.nodes.length} nodes
                      </span>
                      <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTime(workflow.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(workflow.id, workflow.name);
                      }}
                      title="Rename"
                      className="p-1 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-300"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkflow(workflow.id);
                      }}
                      title="Delete"
                      className="p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      isActive ? "text-amber-400" : "text-zinc-600"
                    }`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
