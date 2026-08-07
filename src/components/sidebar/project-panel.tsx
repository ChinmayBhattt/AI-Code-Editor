"use client";

import { useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import { FolderGit2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectPanel() {
  const { projectName, setActiveProject } = useProjectStore();
  const [newProjectName, setNewProjectName] = useState("");

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    setActiveProject(crypto.randomUUID(), newProjectName.trim(), [
      {
        id: crypto.randomUUID(),
        projectId: "default",
        path: "README.md",
        name: "README.md",
        content: `# ${newProjectName.trim()}\n\nCreated with AI Code Studio.\n`,
        language: "markdown",
        isFolder: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    setNewProjectName("");
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#18181b] p-3 text-zinc-300">
      <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
        <FolderGit2 className="h-4 w-4 text-blue-400" /> Projects
      </div>

      <div className="space-y-3 mb-6">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-xs font-medium text-zinc-200">Active Workspace</p>
          <p className="text-xs text-blue-400 font-semibold mt-1">
            {projectName || "Default Workspace"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-zinc-400">Create New Workspace</label>
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="e.g. Next.js Dashboard..."
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
        />
        <Button
          onClick={handleCreate}
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-500 text-xs gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Create Workspace
        </Button>
      </div>
    </div>
  );
}
