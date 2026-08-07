import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EditorTab, CursorPosition, EditorSettings } from "@/types/editor";
import { DEFAULT_EDITOR_SETTINGS } from "@/types/editor";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  settings: EditorSettings;

  // Tab actions
  openTab: (tab: Omit<EditorTab, "isDirty" | "cursorPosition">) => void;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabClean: (tabId: string) => void;
  setCursorPosition: (tabId: string, position: CursorPosition) => void;

  // Settings actions
  updateSettings: (settings: Partial<EditorSettings>) => void;
  resetSettings: () => void;

  // Getters
  getActiveTab: () => EditorTab | undefined;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      settings: DEFAULT_EDITOR_SETTINGS,

      openTab: (tab) =>
        set((state) => {
          // If tab already exists, update its content and switch to it
          const existingIndex = state.tabs.findIndex(
            (t) => t.fileId === tab.fileId || t.path === tab.path
          );
          if (existingIndex !== -1) {
            const updatedTabs = [...state.tabs];
            updatedTabs[existingIndex] = {
              ...updatedTabs[existingIndex],
              content: tab.content,
              isDirty: false,
            };
            return {
              tabs: updatedTabs,
              activeTabId: updatedTabs[existingIndex].id,
            };
          }
          // Otherwise create new tab
          const newTab: EditorTab = {
            ...tab,
            isDirty: false,
            cursorPosition: { lineNumber: 1, column: 1 },
          };
          return {
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
          };
        }),

      closeTab: (tabId) =>
        set((state) => {
          const idx = state.tabs.findIndex((t) => t.id === tabId);
          const newTabs = state.tabs.filter((t) => t.id !== tabId);
          let newActiveId = state.activeTabId;

          if (state.activeTabId === tabId) {
            if (newTabs.length === 0) {
              newActiveId = null;
            } else if (idx >= newTabs.length) {
              newActiveId = newTabs[newTabs.length - 1].id;
            } else {
              newActiveId = newTabs[idx].id;
            }
          }

          return { tabs: newTabs, activeTabId: newActiveId };
        }),

      closeAllTabs: () => set({ tabs: [], activeTabId: null }),

      closeOtherTabs: (tabId) =>
        set((state) => ({
          tabs: state.tabs.filter((t) => t.id === tabId),
          activeTabId: tabId,
        })),

      switchTab: (tabId) => set({ activeTabId: tabId }),

      updateTabContent: (tabId, content) =>
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, content, isDirty: true } : t
          ),
        })),

      markTabClean: (tabId) =>
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, isDirty: false } : t
          ),
        })),

      setCursorPosition: (tabId, position) =>
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, cursorPosition: position } : t
          ),
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () => set({ settings: DEFAULT_EDITOR_SETTINGS }),

      getActiveTab: () => {
        const state = get();
        return state.tabs.find((t) => t.id === state.activeTabId);
      },
    }),
    {
      name: "ai-code-studio-editor",
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
