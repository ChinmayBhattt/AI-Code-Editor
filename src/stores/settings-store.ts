import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIConfig, AppSettings, APIKeys } from "@/types/settings";
import { DEFAULT_AI_CONFIG, DEFAULT_APP_SETTINGS } from "@/types/settings";

// ─── Types ───────────────────────────────────────────────────────────────────

type SidebarPanel = "explorer" | "search" | "projects" | "settings";
type BottomPanelTab = "console" | "terminal" | "logs" | "errors";

interface SettingsState {
  // App Settings
  appSettings: AppSettings;
  aiConfig: AIConfig;
  apiKeys: APIKeys;

  // UI State
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  bottomPanelOpen: boolean;
  liveServerOpen: boolean;
  leftSidebarPanel: SidebarPanel;
  bottomPanelTab: BottomPanelTab;
  settingsDialogOpen: boolean;

  // Logs & Console Outputs
  logs: LogEntry[];
  errors: ErrorEntry[];
  consoleOutputs: ConsoleOutput[];

  // App Settings Actions
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  updateAIConfig: (config: Partial<AIConfig>) => void;
  setApiKey: (provider: keyof APIKeys, key: string) => void;

  // UI Actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleBottomPanel: () => void;
  toggleLiveServer: () => void;
  setLiveServerOpen: (open: boolean) => void;
  setLeftSidebarPanel: (panel: SidebarPanel) => void;
  setBottomPanelTab: (tab: BottomPanelTab) => void;
  setSettingsDialogOpen: (open: boolean) => void;

  // Log & Output Actions
  addLog: (message: string, type?: LogEntry["type"]) => void;
  addError: (message: string, file?: string, line?: number) => void;
  addConsoleOutput: (message: string, type?: ConsoleOutput["type"]) => void;
  clearLogs: () => void;
  clearErrors: () => void;
  clearConsole: () => void;
}

export interface LogEntry {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
}

export interface ErrorEntry {
  id: string;
  message: string;
  file?: string;
  line?: number;
  timestamp: Date;
}

export interface ConsoleOutput {
  id: string;
  message: string;
  type: "log" | "info" | "warn" | "error" | "system";
  timestamp: Date;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      appSettings: DEFAULT_APP_SETTINGS,
      aiConfig: DEFAULT_AI_CONFIG,
      apiKeys: { groq: "", google: "" },

      leftSidebarOpen: true,
      rightSidebarOpen: true,
      bottomPanelOpen: true, // open bottom panel by default so output is immediately visible
      liveServerOpen: false,
      leftSidebarPanel: "explorer" as SidebarPanel,
      bottomPanelTab: "console" as BottomPanelTab,
      settingsDialogOpen: false,

      logs: [],
      errors: [],
      consoleOutputs: [
        {
          id: "init-1",
          message: "$ AI Code Studio Browser Environment initialized.",
          type: "system",
          timestamp: new Date(),
        },
        {
          id: "init-2",
          message: 'Ready to execute code. Click "▶ Run Code" or type commands in terminal.',
          type: "system",
          timestamp: new Date(),
        },
      ],

      // App Settings
      updateAppSettings: (settings) =>
        set((state) => ({
          appSettings: { ...state.appSettings, ...settings },
        })),

      updateAIConfig: (config) =>
        set((state) => ({
          aiConfig: { ...state.aiConfig, ...config },
        })),

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      // UI
      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),

      toggleRightSidebar: () =>
        set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

      toggleBottomPanel: () =>
        set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen })),

      toggleLiveServer: () =>
        set((state) => ({ liveServerOpen: !state.liveServerOpen })),

      setLiveServerOpen: (open) => set({ liveServerOpen: open }),

      setLeftSidebarPanel: (panel) => set({ leftSidebarPanel: panel }),

      setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),

      setSettingsDialogOpen: (open) => set({ settingsDialogOpen: open }),

      // Logs & Outputs
      addLog: (message, type = "info") =>
        set((state) => ({
          logs: [
            ...state.logs,
            {
              id: crypto.randomUUID(),
              message,
              type,
              timestamp: new Date(),
            },
          ].slice(-200),
        })),

      addError: (message, file, line) =>
        set((state) => ({
          errors: [
            ...state.errors,
            {
              id: crypto.randomUUID(),
              message,
              file,
              line,
              timestamp: new Date(),
            },
          ].slice(-100),
        })),

      addConsoleOutput: (message, type = "log") =>
        set((state) => ({
          consoleOutputs: [
            ...state.consoleOutputs,
            {
              id: crypto.randomUUID(),
              message,
              type,
              timestamp: new Date(),
            },
          ].slice(-500),
        })),

      clearLogs: () => set({ logs: [] }),
      clearErrors: () => set({ errors: [] }),
      clearConsole: () => set({ consoleOutputs: [] }),
    }),
    {
      name: "ai-code-studio-settings",
      partialize: (state) => ({
        appSettings: state.appSettings,
        aiConfig: state.aiConfig,
        apiKeys: state.apiKeys,
        leftSidebarOpen: state.leftSidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        bottomPanelOpen: state.bottomPanelOpen,
        liveServerOpen: state.liveServerOpen,
        leftSidebarPanel: state.leftSidebarPanel,
      }),
    }
  )
);
