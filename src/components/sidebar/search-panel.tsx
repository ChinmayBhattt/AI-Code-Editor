"use client";

import { useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import { useEditorStore } from "@/stores/editor-store";
import { Search, FileCode } from "lucide-react";
import { getLanguageFromPath } from "@/lib/utils";

export function SearchPanel() {
  const { files } = useProjectStore();
  const { openTab } = useEditorStore();
  const [query, setQuery] = useState("");

  const results = query.trim()
    ? files.filter(
        (f) =>
          !f.isFolder &&
          (f.name.toLowerCase().includes(query.toLowerCase()) ||
            f.content.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div className="flex h-full w-full flex-col bg-[#18181b] p-3 text-zinc-300">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
        <Search className="h-4 w-4 text-blue-400" /> Search Codebase
      </div>

      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files or code..."
          className="w-full rounded border border-zinc-800 bg-zinc-900 pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
        />
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {query && results.length === 0 && (
          <p className="text-xs text-zinc-500 p-2 text-center">No matching files found.</p>
        )}
        {results.map((file) => (
          <div
            key={file.id}
            onClick={() =>
              openTab({
                id: file.id,
                fileId: file.id,
                path: file.path,
                name: file.name,
                language: file.language || getLanguageFromPath(file.path),
                content: file.content,
              })
            }
            className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800/60 cursor-pointer text-xs"
          >
            <FileCode className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <div className="overflow-hidden">
              <p className="font-medium text-zinc-200 truncate">{file.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{file.path}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
