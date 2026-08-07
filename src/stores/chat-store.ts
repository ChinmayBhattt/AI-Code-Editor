import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatSession, PendingChange } from "@/types/project";

interface ChatState {
  sessions: ChatSession[];
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  currentChatId: string | null;
  error: string | null;
  pendingChanges: PendingChange[];
  historyOpen: boolean;

  // Actions
  startNewChat: () => void;
  loadChatSession: (chatId: string) => void;
  deleteChatSession: (chatId: string) => void;
  toggleHistoryOpen: () => void;
  setHistoryOpen: (open: boolean) => void;

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

function getSessionTitle(msgs: ChatMessage[]): string {
  const firstUserMsg = msgs.find((m) => m.role === "user");
  if (!firstUserMsg) return "New Chat";
  const text = firstUserMsg.content.trim();
  if (text.length <= 36) return text;
  return text.slice(0, 34) + "...";
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      messages: [],
      isStreaming: false,
      streamingContent: "",
      currentChatId: null,
      error: null,
      pendingChanges: [],
      historyOpen: false,

      startNewChat: () => {
        const { currentChatId, messages, sessions } = get();
        let updatedSessions = [...sessions];
        if (messages.length > 0) {
          const chatId = currentChatId || crypto.randomUUID();
          const existingIdx = updatedSessions.findIndex((s) => s.id === chatId);
          const newSession: ChatSession = {
            id: chatId,
            title: getSessionTitle(messages),
            createdAt: existingIdx >= 0 ? updatedSessions[existingIdx].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages,
          };
          if (existingIdx >= 0) {
            updatedSessions[existingIdx] = newSession;
          } else {
            updatedSessions.unshift(newSession);
          }
        }

        const newId = crypto.randomUUID();
        set({
          sessions: updatedSessions,
          currentChatId: newId,
          messages: [],
          streamingContent: "",
          error: null,
          pendingChanges: [],
          historyOpen: false,
        });
      },

      loadChatSession: (chatId) => {
        const { currentChatId, messages, sessions } = get();
        let updatedSessions = [...sessions];

        if (currentChatId && messages.length > 0) {
          const existingIdx = updatedSessions.findIndex((s) => s.id === currentChatId);
          const currentSession: ChatSession = {
            id: currentChatId,
            title: getSessionTitle(messages),
            createdAt: existingIdx >= 0 ? updatedSessions[existingIdx].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages,
          };
          if (existingIdx >= 0) {
            updatedSessions[existingIdx] = currentSession;
          } else {
            updatedSessions.unshift(currentSession);
          }
        }

        const targetSession = updatedSessions.find((s) => s.id === chatId);
        if (targetSession) {
          set({
            sessions: updatedSessions,
            currentChatId: targetSession.id,
            messages: targetSession.messages,
            streamingContent: "",
            error: null,
            pendingChanges: [],
            historyOpen: false,
          });
        }
      },

      deleteChatSession: (chatId) => {
        const { currentChatId, sessions } = get();
        const updated = sessions.filter((s) => s.id !== chatId);
        const isCurrent = currentChatId === chatId;
        set({
          sessions: updated,
          ...(isCurrent
            ? {
                currentChatId: crypto.randomUUID(),
                messages: [],
                streamingContent: "",
                pendingChanges: [],
                error: null,
              }
            : {}),
        });
      },

      toggleHistoryOpen: () => set((state) => ({ historyOpen: !state.historyOpen })),
      setHistoryOpen: (open) => set({ historyOpen: open }),

      addMessage: (message) => {
        const state = get();
        const newMessages = [...state.messages, message];
        const chatId = state.currentChatId || crypto.randomUUID();

        const existingIdx = state.sessions.findIndex((s) => s.id === chatId);
        let updatedSessions = [...state.sessions];
        const sessionItem: ChatSession = {
          id: chatId,
          title: getSessionTitle(newMessages),
          createdAt: existingIdx >= 0 ? updatedSessions[existingIdx].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: newMessages,
        };

        if (existingIdx >= 0) {
          updatedSessions[existingIdx] = sessionItem;
        } else {
          updatedSessions.unshift(sessionItem);
        }

        set({
          currentChatId: chatId,
          messages: newMessages,
          sessions: updatedSessions,
        });
      },

      setMessages: (messages) => set({ messages }),

      clearMessages: () => {
        const { currentChatId, sessions } = get();
        let updated = sessions;
        if (currentChatId) {
          updated = sessions.filter((s) => s.id !== currentChatId);
        }
        set({
          messages: [],
          streamingContent: "",
          pendingChanges: [],
          sessions: updated,
          currentChatId: crypto.randomUUID(),
        });
      },

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
    }),
    {
      name: "ai-code-studio-chat-history",
      partialize: (state) => ({
        sessions: state.sessions,
        currentChatId: state.currentChatId,
        messages: state.messages,
      }),
    }
  )
);
