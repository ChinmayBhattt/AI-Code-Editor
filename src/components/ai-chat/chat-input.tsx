"use client";

import { useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { AI_MODELS } from "@/types/settings";
import { Send, Sparkles, FileText, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const { aiConfig, updateAIConfig } = useSettingsStore();

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#18181b] border-t border-zinc-800">
      {/* Top Bar: Plan/Build Mode Selector & Model Selector */}
      <div className="flex items-center justify-between gap-2">
        {/* Mode Selector Toggle (Plan vs Build) */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-medium">
          <button
            onClick={() => updateAIConfig({ mode: "plan" })}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
              aiConfig.mode === "plan"
                ? "bg-indigo-600 text-white font-semibold shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="h-3 w-3" /> Plan
          </button>
          <button
            onClick={() => updateAIConfig({ mode: "build" })}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
              aiConfig.mode === "build"
                ? "bg-blue-600 text-white font-semibold shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Hammer className="h-3 w-3" /> Build
          </button>
        </div>

        {/* Model Selector Dropdown */}
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <select
            value={aiConfig.modelId}
            onChange={(e) => {
              const selectedModel = AI_MODELS.find((m) => m.id === e.target.value);
              if (selectedModel) {
                updateAIConfig({
                  modelId: selectedModel.id,
                  provider: selectedModel.provider,
                });
              }
            }}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-1.5 py-0.5 text-[11px] outline-none focus:border-zinc-700"
          >
            {AI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Box */}
      <div className="relative">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={
            aiConfig.mode === "plan"
              ? "Plan Mode: Describe what app/feature to plan in plan.md..."
              : "Build Mode: Describe what files to create or build directly..."
          }
          className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/90 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500/50"
        />

        <Button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          size="sm"
          className="absolute right-2 bottom-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-md p-1.5 h-7 w-7"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
