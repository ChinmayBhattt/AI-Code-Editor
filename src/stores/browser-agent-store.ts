import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AgentStatus =
  | "idle"
  | "navigating"
  | "inspecting"
  | "interacting"
  | "reproducing"
  | "analyzing_bug"
  | "fixing_code"
  | "retesting"
  | "completed"
  | "failed";

export interface AgentActionLog {
  id: string;
  timestamp: string;
  type: "navigate" | "click" | "type" | "scroll" | "inspect" | "console_error" | "network_error" | "fix_applied" | "verification";
  description: string;
  targetSelector?: string;
  status: "pending" | "success" | "error" | "warning" | "fixed";
  screenshotUrl?: string;
  codeSnippet?: string;
  filePath?: string;
}

export interface BugReport {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  reproductionSteps: string[];
  affectedFile?: string;
  errorLog?: string;
  suggestedFix?: string;
  status: "detected" | "fixing" | "verified";
}

interface BrowserAgentState {
  // Browser state
  url: string;
  currentTitle: string;
  isOpen: boolean;
  isFullScreen: boolean;
  activeTab: "preview" | "agent_logs" | "report";

  // Agent execution state
  status: AgentStatus;
  currentTaskGoal: string;
  currentStepDescription: string;
  targetElementSelector: string | null;

  // Logs & Reports
  actionLogs: AgentActionLog[];
  consoleErrors: string[];
  networkErrors: string[];
  bugsFound: BugReport[];
  screenshots: string[];

  // Actions
  setUrl: (url: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleFullScreen: () => void;
  setActiveTab: (tab: "preview" | "agent_logs" | "report") => void;
  setStatus: (status: AgentStatus) => void;
  setCurrentTask: (goal: string) => void;
  setTargetElement: (selector: string | null) => void;
  addActionLog: (log: Omit<AgentActionLog, "id" | "timestamp">) => void;
  addConsoleError: (error: string) => void;
  addBugReport: (bug: Omit<BugReport, "id">) => void;
  updateBugReportStatus: (id: string, status: BugReport["status"]) => void;
  clearLogs: () => void;
  runAgentTask: (goal: string, targetUrl?: string) => Promise<void>;
  stopAgentTask: () => void;
}

export const useBrowserAgentStore = create<BrowserAgentState>()(
  persist(
    (set, get) => ({
      url: "http://localhost:3000",
      currentTitle: "Local App Preview",
      isOpen: false,
      isFullScreen: true,
      activeTab: "preview",

      status: "idle",
      currentTaskGoal: "",
      currentStepDescription: "",
      targetElementSelector: null,

      actionLogs: [],
      consoleErrors: [],
      networkErrors: [],
      bugsFound: [],
      screenshots: [],

      setUrl: (url) => set({ url }),
      setIsOpen: (isOpen) => set({ isOpen }),
      toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setStatus: (status) => set({ status }),
      setCurrentTask: (goal) => set({ currentTaskGoal: goal }),
      setTargetElement: (selector) => set({ targetElementSelector: selector }),

      addActionLog: (log) => {
        const newLog: AgentActionLog = {
          ...log,
          id: `log-${crypto.randomUUID().slice(0, 6)}`,
          timestamp: new Date().toLocaleTimeString(),
        };
        set((state) => ({
          actionLogs: [newLog, ...state.actionLogs],
        }));
      },

      addConsoleError: (error) => {
        set((state) => ({
          consoleErrors: [...state.consoleErrors, error],
        }));
      },

      addBugReport: (bug) => {
        const newBug: BugReport = {
          ...bug,
          id: `bug-${crypto.randomUUID().slice(0, 6)}`,
        };
        set((state) => ({
          bugsFound: [newBug, ...state.bugsFound],
        }));
      },

      updateBugReportStatus: (id, status) => {
        set((state) => ({
          bugsFound: state.bugsFound.map((b) => (b.id === id ? { ...b, status } : b)),
        }));
      },

      clearLogs: () => {
        set({
          actionLogs: [],
          consoleErrors: [],
          networkErrors: [],
          bugsFound: [],
          status: "idle",
          currentStepDescription: "",
          targetElementSelector: null,
        });
      },

      runAgentTask: async (goal, targetUrl) => {
        const target = targetUrl || get().url || "http://localhost:3000";
        set({
          url: target,
          isOpen: true,
          isFullScreen: true,
          status: "navigating",
          currentTaskGoal: goal,
          activeTab: "preview",
        });

        const { executeBrowserAgentTask } = await import("@/lib/browser/browser-agent-executor");
        await executeBrowserAgentTask(goal, target);
      },

      stopAgentTask: () => {
        set({
          status: "idle",
          currentStepDescription: "Agent stopped by user.",
          targetElementSelector: null,
        });
      },
    }),
    {
      name: "ai-code-studio-browser-agent",
      partialize: (state) => ({
        url: state.url,
        bugsFound: state.bugsFound,
      }),
    }
  )
);
