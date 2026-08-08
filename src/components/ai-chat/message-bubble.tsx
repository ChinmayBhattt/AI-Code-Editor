"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User, FileCode, Check, Copy, ChevronRight, ChevronDown, Brain, Play } from "lucide-react";
import { useState } from "react";
import { parseFileOperations } from "@/lib/ai/file-operations";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
  isLastAssistantMessage?: boolean;
  onProceed?: () => void;
}

export function MessageBubble({ role, content, images, isLastAssistantMessage, onProceed }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const isUser = role === "user";

  const fileOps = !isUser ? parseFileOperations(content) : [];
  const isPlanMessage =
    !isUser &&
    (content.includes("plan.md") ||
      content.includes("Implementation Plan") ||
      fileOps.some((op) => op.path === "plan.md"));

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 text-xs leading-relaxed min-w-0 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div
        className={`relative min-w-0 max-w-[88%] rounded-xl p-3.5 space-y-2 border overflow-hidden break-words ${
          isUser
        }`}
      >
        {/* Render attached images / screenshots */}
        {images && images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {images.map((imgUrl, i) => (
              <a
                key={i}
                href={imgUrl}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-zinc-700/80 hover:border-blue-500 transition-colors shadow-md group"
              >
                <img
                  src={imgUrl}
                  alt={`Screenshot ${i + 1}`}
                  className="max-h-48 max-w-xs object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </a>
            ))}
          </div>
        )}

        {/* Collapsible Thinking Header */}
        {!isUser && (
          <div className="border-b border-zinc-800/80 pb-2">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-medium"
            >
              <Brain className="h-3.5 w-3.5 text-indigo-400" />
              <span>Worked for 2m</span>
              {showThinking ? (
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
              )}
            </button>

            {showThinking && (
              <div className="mt-2 p-2.5 rounded bg-zinc-950/60 border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1 font-mono">
                <p>• Researched workspace files and prompt intent.</p>
                <p>• Formulated architectural plan and file structure.</p>
                <p>• Created plan.md for review before building.</p>
              </div>
            )}
          </div>
        )}

        {/* File operations pill summary */}
        {!isUser && fileOps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {fileOps.map((op, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium truncate max-w-full ${
                  op.type === "create"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : op.type === "edit"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                <FileCode className="h-3 w-3 shrink-0" />
                <span className="truncate">{op.type}: {op.path}</span>
              </span>
            ))}
          </div>
        )}

        {/* Message Content with Strict Text & Code Wrapping */}
        <div className="prose prose-invert prose-xs max-w-full min-w-0 overflow-hidden break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              pre({ children }) {
                return (
                  <pre className="overflow-x-auto max-w-full rounded-lg bg-zinc-950/90 p-3 font-mono text-[11px] border border-zinc-800/80 my-2 whitespace-pre-wrap break-words">
                    {children}
                  </pre>
                );
              },
              code({ children, className }) {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-zinc-800/80 text-blue-300 px-1 py-0.5 rounded text-[11px] font-mono break-all">
                    {children}
                  </code>
                ) : (
                  <code className="font-mono text-zinc-200">{children}</code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Proceed to Build Button inside message bubble */}
        {!isUser && isLastAssistantMessage && isPlanMessage && onProceed && (
          <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-[11px] text-indigo-300 font-medium">Plan generated. Ready to build?</span>
            <button
              onClick={onProceed}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 shrink-0"
            >
              <Play className="h-3.5 w-3.5" /> Proceed to Build
            </button>
          </div>
        )}

        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 p-1 text-zinc-500 hover:text-zinc-300 rounded"
            title="Copy response"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
