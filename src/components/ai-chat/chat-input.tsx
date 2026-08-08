"use client";

import { useState, useRef } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { AI_MODELS } from "@/types/settings";
import { Send, Sparkles, FileText, Hammer, Image, X, Paperclip, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string, images?: string[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { aiConfig, updateAIConfig } = useSettingsStore();

  const handleSend = () => {
    if ((!input.trim() && attachedImages.length === 0) || disabled) return;
    const finalMsg = input.trim() || (attachedImages.length > 0 ? "Convert this screenshot design into a complete website." : "");
    onSend(finalMsg, attachedImages.length > 0 ? attachedImages : undefined);
    setInput("");
    setAttachedImages([]);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setAttachedImages((prev) => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Handle Clipboard Paste (Cmd+V / Ctrl+V screenshot paste)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setAttachedImages((prev) => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyScreenshotPreset = () => {
    setInput("Convert this screenshot UI design into a complete, pixel-perfect, modern responsive website (index.html, style.css, script.js).");
  };

  return (
    <div
      className={`flex flex-col gap-2 p-3 bg-[#18181b] border-t transition-colors ${
        isDraggingOver ? "border-blue-500 bg-blue-950/20" : "border-zinc-800"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

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

      {/* Attached Images Preview Bar */}
      {attachedImages.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 rounded-lg bg-zinc-900/90 border border-blue-500/30">
          {attachedImages.map((img, idx) => (
            <div key={idx} className="relative group shrink-0">
              <img
                src={img}
                alt="Screenshot attachment"
                className="h-14 w-20 object-cover rounded-md border border-zinc-700 shadow-sm"
              />
              <button
                onClick={() => handleRemoveImage(idx)}
                className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white shadow hover:bg-rose-500 transition-colors"
                title="Remove image"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}

          <button
            onClick={handleApplyScreenshotPreset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-600/20 text-blue-300 border border-blue-500/40 text-[10px] font-semibold hover:bg-blue-600/30 transition-colors shrink-0 ml-auto"
          >
            <Wand2 className="h-3 w-3 text-blue-400" />
            Screenshot → Website
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className="relative">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={
            attachedImages.length > 0
              ? "Screenshot attached! Describe website or click 'Screenshot → Website'..."
              : aiConfig.mode === "plan"
              ? "Plan Mode: Describe app or paste/upload screenshot..."
              : "Build Mode: Describe code or upload screenshot to build website..."
          }
          className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/90 p-2.5 pr-16 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500/50"
        />

        {/* Buttons on bottom right */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="p-1 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
            title="Upload Screenshot / Image"
          >
            <Image className="h-4 w-4" />
          </button>

          <Button
            onClick={handleSend}
            disabled={(!input.trim() && attachedImages.length === 0) || disabled}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-md p-1.5 h-7 w-7"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
