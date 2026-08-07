"use client";

import { useSettingsStore } from "@/stores/settings-store";
import { useEditorStore } from "@/stores/editor-store";
import { AI_MODELS } from "@/types/settings";
import { X, Key, Sliders, Monitor, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SettingsDialog() {
  const {
    settingsDialogOpen,
    setSettingsDialogOpen,
    apiKeys,
    setApiKey,
    aiConfig,
    updateAIConfig,
    appSettings,
    updateAppSettings,
  } = useSettingsStore();

  const { settings, updateSettings } = useEditorStore();
  const [activeTab, setActiveTab] = useState<"keys" | "ai" | "editor">("keys");
  const [saved, setSaved] = useState(false);

  if (!settingsDialogOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSettingsDialogOpen(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex h-[450px] w-[650px] flex-col rounded-xl border border-zinc-800 bg-[#141417] shadow-2xl text-zinc-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-400" /> Settings & Configurations
          </h2>
          <button
            onClick={() => setSettingsDialogOpen(false)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-44 border-r border-zinc-800 p-2 space-y-1 bg-[#18181b]">
            <button
              onClick={() => setActiveTab("keys")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === "keys"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              <Key className="h-3.5 w-3.5" /> API Keys
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === "ai"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> AI Model Config
            </button>

            <button
              onClick={() => setActiveTab("editor")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === "editor"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" /> Editor Preferences
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "keys" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">
                    Groq API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeys.groq}
                    onChange={(e) => setApiKey("groq", e.target.value)}
                    placeholder="gsk_..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Get key at{" "}
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline"
                    >
                      console.groq.com
                    </a>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeys.google}
                    onChange={(e) => setApiKey("google", e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Get key at{" "}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline"
                    >
                      aistudio.google.com
                    </a>
                  </p>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">
                    Default Model
                  </label>
                  <select
                    value={aiConfig.modelId}
                    onChange={(e) => {
                      const selected = AI_MODELS.find((m) => m.id === e.target.value);
                      if (selected) {
                        updateAIConfig({
                          modelId: selected.id,
                          provider: selected.provider,
                        });
                      }
                    }}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none"
                  >
                    {AI_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider.toUpperCase()}) — {m.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">
                    Temperature ({aiConfig.temperature})
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={aiConfig.temperature}
                    onChange={(e) => updateAIConfig({ temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === "editor" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-200 block mb-1">
                    Font Size ({settings.fontSize}px)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={24}
                    value={settings.fontSize}
                    onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                    className="w-[#100px] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-200">Show Minimap</span>
                  <input
                    type="checkbox"
                    checked={settings.minimap}
                    onChange={(e) => updateSettings({ minimap: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-200">Auto Save Files</span>
                  <input
                    type="checkbox"
                    checked={appSettings.autoSave}
                    onChange={(e) => updateAppSettings({ autoSave: e.target.checked })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-800 px-4 py-2.5">
          <Button
            onClick={handleSave}
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-xs gap-1.5"
          >
            {saved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
            {saved ? "Saved Settings" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
