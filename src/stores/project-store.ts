import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProjectFile, FileTreeNode } from "@/types/project";
import { getLanguageFromPath } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectState {
  // Data
  activeProjectId: string | null;
  projectName: string;
  files: ProjectFile[];
  expandedFolders: Set<string>;

  // Actions
  setActiveProject: (id: string, name: string, files: ProjectFile[]) => void;
  clearProject: () => void;
  addFile: (file: ProjectFile) => void;
  updateFileContent: (fileId: string, content: string) => void;
  removeFile: (fileId: string) => void;
  renameFile: (fileId: string, newPath: string, newName: string) => void;
  setFiles: (files: ProjectFile[]) => void;
  toggleFolder: (path: string) => void;
  getFileTree: () => FileTreeNode[];
  getFileByPath: (path: string) => ProjectFile | undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFileTree(files: ProjectFile[], expandedFolders: Set<string>): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const folderMap = new Map<string, FileTreeNode>();

  // Sort: folders first, then alphabetical
  const sorted = [...files].sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const file of sorted) {
    const parts = file.path.split("/");
    const node: FileTreeNode = {
      id: file.id,
      name: file.name,
      path: file.path,
      isFolder: file.isFolder,
      language: file.language,
      children: file.isFolder ? [] : undefined,
      isExpanded: expandedFolders.has(file.path),
    };

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = folderMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(node);
      } else {
        root.push(node);
      }
    }

    if (file.isFolder) {
      folderMap.set(file.path, node);
    }
  }

  return root;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      activeProjectId: null,
      projectName: "",
      files: [],
      expandedFolders: new Set<string>(),

      setActiveProject: (id, name, files) =>
        set({ activeProjectId: id, projectName: name, files }),

      clearProject: () =>
        set({ activeProjectId: null, projectName: "", files: [] }),

      addFile: (file) =>
        set((state) => ({
          files: [...state.files, file],
        })),

      updateFileContent: (fileId, content) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === fileId ? { ...f, content, updatedAt: new Date() } : f
          ),
        })),

      removeFile: (fileId) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== fileId),
        })),

      renameFile: (fileId, newPath, newName) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  path: newPath,
                  name: newName,
                  language: getLanguageFromPath(newPath),
                  updatedAt: new Date(),
                }
              : f
          ),
        })),

      setFiles: (files) => set({ files }),

      toggleFolder: (path) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolders);
          if (newExpanded.has(path)) {
            newExpanded.delete(path);
          } else {
            newExpanded.add(path);
          }
          return { expandedFolders: newExpanded };
        }),

      getFileTree: () => {
        const state = get();
        return buildFileTree(state.files, state.expandedFolders);
      },

      getFileByPath: (path) => {
        return get().files.find((f) => f.path === path);
      },
    }),
    {
      name: "ai-code-studio-project",
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        projectName: state.projectName,
        expandedFolders: Array.from(state.expandedFolders),
        // NOTE: files are NOT persisted — always fetched fresh from workspace/
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown>;
        return {
          ...current,
          ...(p || {}),
          files: [], // Always start with empty files — synced from disk
          expandedFolders: new Set(
            (p?.expandedFolders as string[]) || []
          ),
        };
      },
    }
  )
);
