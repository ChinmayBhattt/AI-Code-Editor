"use client";

import { useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import {
  MessageSquare,
  Plus,
  Trash2,
  X,
  Search,
  Clock,
  ChevronRight,
} from "lucide-react";

export function ChatHistory() {
  const {
    sessions,
    currentChatId,
    startNewChat,
    loadChatSession,
    deleteChatSession,
    setHistoryOpen,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#141417] text-zinc-300 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-800 px-3 text-xs font-semibold shrink-0 bg-zinc-900/90">
        <div className="flex items-center gap-2 text-zinc-200">
          <Clock className="h-4 w-4 text-indigo-400" />
          <span>Chat History</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
            {sessions.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={startNewChat}
            className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors"
            title="Start New Chat"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setHistoryOpen(false)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            title="Close History"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-zinc-800/80 bg-zinc-950/40">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chat history..."
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-zinc-500 space-y-2">
            <MessageSquare className="h-8 w-8 text-zinc-600/50" />
            <p className="text-xs font-medium text-zinc-400">
              {searchQuery ? "No matching chats found" : "No Chat History Yet"}
            </p>
            <p className="text-[11px] text-zinc-500 max-w-[200px]">
              {searchQuery
                ? "Try searching for another topic."
                : "Your past AI assistant conversations will be saved here automatically."}
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isCurrent = session.id === currentChatId;
            const messageCount = session.messages ? session.messages.length : 0;

            return (
              <div
                key={session.id}
                onClick={() => loadChatSession(session.id)}
                className={`group relative flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isCurrent
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-100 shadow-sm"
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start gap-2.5 overflow-hidden pr-6">
                  <MessageSquare
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      isCurrent ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-400"
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate leading-tight text-zinc-200">
                      {session.title || "Untitled Chat"}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 font-mono">
                      <span>{formatDate(session.updatedAt)}</span>
                      <span>•</span>
                      <span>{messageCount} msg{messageCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChatSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight
                    className={`h-3.5 w-3.5 ${
                      isCurrent ? "text-indigo-400" : "text-zinc-600 group-hover:text-zinc-400"
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
