// ─── Project Types ───────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isFolder: boolean;
  createdAt: Date;
  updatedAt: Date;
  pendingContent?: string;
  pendingStatus?: "created" | "modified" | "deleted";
  diffAdditions?: number;
  diffDeletions?: number;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  language?: string;
  children?: FileTreeNode[];
  isExpanded?: boolean;
  pendingStatus?: "created" | "modified" | "deleted";
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  files: ProjectFile[];
}

export interface FileOperation {
  type: "create" | "edit" | "delete" | "rename";
  path: string;
  newPath?: string;
  content?: string;
  additions?: number;
  deletions?: number;
}

export interface PendingChange {
  id: string;
  path: string;
  type: "create" | "edit" | "delete";
  content: string;
  originalContent: string;
  additions: number;
  deletions: number;
}
