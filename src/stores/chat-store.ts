import { create } from "zustand";
import type { ChatMessage, PendingChange } from "@/types/project";

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  currentChatId: string | null;
  error: string | null;
  pendingChanges: PendingChange[];

  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  setCurrentChatId: (chatId: string | null) => void;
  setError: (error: string | null) => void;
  setPendingChanges: (changes: PendingChange[]) => void;
  clearPendingChanges: () => void;
  removePendingChange: (id: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isStreaming: false,
  streamingContent: "",
  currentChatId: null,
  error: null,
  pendingChanges: [],

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  clearMessages: () => set({ messages: [], streamingContent: "", pendingChanges: [] }),

  setStreaming: (streaming) =>
    set({
      isStreaming: streaming,
      ...(streaming ? { streamingContent: "", error: null } : {}),
    }),

  setStreamingContent: (content) => set({ streamingContent: content }),

  appendStreamingContent: (chunk) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),

  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),

  setError: (error) => set({ error, isStreaming: false }),

  setPendingChanges: (pendingChanges) => set({ pendingChanges }),

  clearPendingChanges: () => set({ pendingChanges: [] }),

  removePendingChange: (id) =>
    set((state) => ({
      pendingChanges: state.pendingChanges.filter((c) => c.id !== id),
    })),
}));
