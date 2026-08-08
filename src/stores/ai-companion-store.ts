import { create } from "zustand";

export type CompanionState =
  | "idle"
  | "thinking"
  | "coding"
  | "analyzing"
  | "debugging"
  | "success"
  | "error";

interface AICompanionState {
  state: CompanionState;
  speechMessage: string;
  isVisible: boolean;
  activeAction: string;
  
  // Actions
  setState: (state: CompanionState, message?: string) => void;
  setSpeechMessage: (message: string) => void;
  setIsVisible: (isVisible: boolean) => void;
  resetToIdle: () => void;
}

export const useAICompanionStore = create<AICompanionState>((set) => ({
  state: "idle",
  speechMessage: "Hello! I'm Nova, your AI Coding Companion. Ask me anything or request code analysis!",
  isVisible: true,
  activeAction: "Ready to assist",

  setState: (state, message) =>
    set((s) => ({
      state,
      speechMessage: message || getStatusMessage(state),
    })),

  setSpeechMessage: (message) => set({ speechMessage: message }),
  setIsVisible: (isVisible) => set({ isVisible }),
  resetToIdle: () =>
    set({
      state: "idle",
      speechMessage: "Standing by. How can I help you write or debug code?",
    }),
}));

function getStatusMessage(state: CompanionState): string {
  switch (state) {
    case "thinking":
      return "Thinking... Planning best implementation strategy.";
    case "coding":
      return "Writing clean, optimized code for your workspace...";
    case "analyzing":
      return "Analyzing codebase dependencies and architecture...";
    case "debugging":
      return "Hunting down runtime bugs and exceptions...";
    case "success":
      return "Task completed successfully! All code verified clean. ✅";
    case "error":
      return "Error detected. Let's fix this issue together!";
    default:
      return "Nova AI Companion Ready.";
  }
}
