"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useProjectStore } from "@/stores/project-store";
import { useEditorStore } from "@/stores/editor-store";
import type { FileTreeNode, ProjectFile } from "@/types/project";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FileType,
  Trash2,
  Edit2,
  FilePlus,
  FolderPlus,
  RotateCw,
  FolderMinus,
  Copy,
  Scissors,
  Clipboard,
  FolderInput,
} from "lucide-react";
import { getLanguageFromPath } from "@/lib/utils";

// ─── File Icon Helper ────────────────────────────────────────────────────────

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const iconMap: Record<string, { icon: typeof FileCode; color: string }> = {
    js: { icon: FileCode, color: "text-yellow-400" },
    jsx: { icon: FileCode, color: "text-yellow-400" },
    ts: { icon: FileCode, color: "text-blue-400" },
    tsx: { icon: FileCode, color: "text-blue-400" },
    json: { icon: FileJson, color: "text-amber-400" },
    html: { icon: FileCode, color: "text-orange-400" },
    css: { icon: FileCode, color: "text-purple-400" },
    scss: { icon: FileCode, color: "text-pink-400" },
    md: { icon: FileText, color: "text-zinc-400" },
    py: { icon: FileCode, color: "text-green-400" },
    cpp: { icon: FileCode, color: "text-cyan-400" },
    c: { icon: FileCode, color: "text-cyan-400" },
    java: { icon: FileCode, color: "text-red-400" },
    go: { icon: FileCode, color: "text-sky-400" },
    rs: { icon: FileCode, color: "text-orange-500" },
    sql: { icon: FileCode, color: "text-emerald-400" },
    sh: { icon: FileCode, color: "text-lime-400" },
    yaml: { icon: FileText, color: "text-rose-400" },
    yml: { icon: FileText, color: "text-rose-400" },
    xml: { icon: FileCode, color: "text-orange-300" },
    svg: { icon: FileCode, color: "text-amber-300" },
    txt: { icon: FileText, color: "text-zinc-400" },
  };
  const match = iconMap[ext];
  if (match) return match;
  return { icon: FileType, color: "text-zinc-500" };
}

// ─── Context Menu ────────────────────────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  node: FileTreeNode | null;
  isBackground: boolean;
}

function ContextMenu({
  state,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCut,
  onCopy,
  onPaste,
  hasCopied,
}: {
  state: ContextMenuState;
  onClose: () => void;
  onNewFile: (parentPath: string) => void;
  onNewFolder: (parentPath: string) => void;
  onRename: (node: FileTreeNode) => void;
  onDelete: (node: FileTreeNode) => void;
  onCut: (node: FileTreeNode) => void;
  onCopy: (node: FileTreeNode) => void;
  onPaste: (targetFolder: string) => void;
  hasCopied: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const parentPath = state.node
    ? state.node.isFolder
      ? state.node.path
      : state.node.path.split("/").slice(0, -1).join("/")
    : "";

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-md border border-zinc-700 bg-zinc-900 py-1 text-xs text-zinc-200 shadow-xl shadow-black/40 select-none"
      style={{ left: state.x, top: state.y }}
    >
      <button
        onClick={() => { onNewFile(parentPath); onClose(); }}
        className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-zinc-800"
      >
        <FilePlus className="h-3.5 w-3.5 text-blue-400" /> New File
      </button>
      <button
        onClick={() => { onNewFolder(parentPath); onClose(); }}
        className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-zinc-800"
      >
        <FolderPlus className="h-3.5 w-3.5 text-amber-400" /> New Folder
      </button>

      {state.node && !state.isBackground && (
        <>
          <div className="my-1 h-px bg-zinc-800" />
          <button
            onClick={() => { onCut(state.node!); onClose(); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-zinc-800"
          >
            <Scissors className="h-3.5 w-3.5 text-zinc-400" /> Cut
          </button>
          <button
            onClick={() => { onCopy(state.node!); onClose(); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-zinc-800"
          >
            <Copy className="h-3.5 w-3.5 text-zinc-400" /> Copy
          </button>
          {hasCopied && (
            <button
              onClick={() => { onPaste(parentPath); onClose(); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-zinc-800"
            >
              <Clipboard className="h-3.5 w-3.5 text-zinc-400" /> Paste
            </button>
          )}
          <div className="my-1 h-px bg-zinc-800" />
          <button
            onClick={() => { onRename(state.node!); onClose(); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-zinc-800"
          >
            <Edit2 className="h-3.5 w-3.5 text-zinc-400" /> Rename
          </button>
          <button
            onClick={() => { onDelete(state.node!); onClose(); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </>
      )}

      {!state.node && hasCopied && (
        <>
          <div className="my-1 h-px bg-zinc-800" />
          <button
            onClick={() => { onPaste(""); onClose(); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-zinc-800"
          >
            <Clipboard className="h-3.5 w-3.5 text-zinc-400" /> Paste Here
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main FileExplorer Component ─────────────────────────────────────────────

export function FileExplorer() {
  const {
    files,
    projectName,
    getFileTree,
    toggleFolder,
    addFile,
    removeFile,
    renameFile,
    setFiles,
    updateFileContent,
  } = useProjectStore();
  const { openTab } = useEditorStore();

  const [refreshing, setRefreshing] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [creatingIn, setCreatingIn] = useState<{ parentPath: string; isFolder: boolean } | null>(null);
  const [creatingName, setCreatingName] = useState("");
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{ node: FileTreeNode; mode: "cut" | "copy" } | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Sync from workspace/ filesystem
  const syncFilesystem = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch {} finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { syncFilesystem(); }, []);

  const fileTree = getFileTree();

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleFileClick = (file: ProjectFile) => {
    setSelectedPath(file.path);
    if (file.isFolder) {
      toggleFolder(file.path);
    } else {
      openTab({
        id: file.id,
        fileId: file.id,
        path: file.path,
        name: file.name,
        language: file.language || getLanguageFromPath(file.path),
        content: file.content,
      });
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node?: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node: node || null,
      isBackground: !node,
    });
  };

  const handleNewFile = (parentPath: string) => {
    setCreatingIn({ parentPath, isFolder: false });
    setCreatingName("");
  };

  const handleNewFolder = (parentPath: string) => {
    setCreatingIn({ parentPath, isFolder: true });
    setCreatingName("");
  };

  const confirmCreate = () => {
    if (!creatingIn || !creatingName.trim()) {
      setCreatingIn(null);
      return;
    }
    const path = creatingIn.parentPath
      ? `${creatingIn.parentPath}/${creatingName.trim()}`
      : creatingName.trim();

    addFile({
      id: crypto.randomUUID(),
      projectId: "default",
      path,
      name: creatingName.trim(),
      content: creatingIn.isFolder ? "" : "",
      language: getLanguageFromPath(path),
      isFolder: creatingIn.isFolder,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Auto expand parent folder
    if (creatingIn.parentPath) {
      const parentExpanded = files.find(
        (f) => f.isFolder && f.path === creatingIn.parentPath
      );
      if (parentExpanded) toggleFolder(creatingIn.parentPath);
      // Toggle twice to ensure open
      toggleFolder(creatingIn.parentPath);
    }

    setCreatingIn(null);
    setCreatingName("");
  };

  const handleRename = (node: FileTreeNode) => {
    setEditingNodeId(node.id);
    setEditingName(node.name);
  };

  const confirmRename = (nodeId: string, currentPath: string) => {
    if (!editingName.trim()) {
      setEditingNodeId(null);
      return;
    }
    const parts = currentPath.split("/");
    parts[parts.length - 1] = editingName.trim();
    renameFile(nodeId, parts.join("/"), editingName.trim());
    setEditingNodeId(null);
  };

  const handleDelete = (node: FileTreeNode) => {
    // Also delete children if folder
    if (node.isFolder) {
      const toRemove = files.filter(
        (f) => f.path === node.path || f.path.startsWith(node.path + "/")
      );
      toRemove.forEach((f) => removeFile(f.id));
    } else {
      removeFile(node.id);
    }
  };

  const handleCut = (node: FileTreeNode) => {
    setClipboard({ node, mode: "cut" });
  };

  const handleCopy = (node: FileTreeNode) => {
    setClipboard({ node, mode: "copy" });
  };

  const handlePaste = (targetFolder: string) => {
    if (!clipboard) return;
    const srcFile = files.find((f) => f.id === clipboard.node.id);
    if (!srcFile) return;

    const newPath = targetFolder
      ? `${targetFolder}/${srcFile.name}`
      : srcFile.name;

    if (clipboard.mode === "cut") {
      renameFile(srcFile.id, newPath, srcFile.name);
    } else {
      addFile({
        ...srcFile,
        id: crypto.randomUUID(),
        path: newPath,
      });
    }
    setClipboard(null);
  };

  // ─── Drag & Drop ────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, node: FileTreeNode) => {
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, node: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.isFolder) {
      e.dataTransfer.dropEffect = "move";
      setDragOverPath(node.path);
    }
  };

  const handleDragLeave = () => {
    setDragOverPath(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolder: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);

    if (!targetFolder.isFolder) return;

    const draggedId = e.dataTransfer.getData("text/plain");
    const draggedFile = files.find((f) => f.id === draggedId);
    if (!draggedFile) return;

    // Don't drop on itself or its own child
    if (
      draggedFile.path === targetFolder.path ||
      targetFolder.path.startsWith(draggedFile.path + "/")
    ) {
      return;
    }

    const newPath = `${targetFolder.path}/${draggedFile.name}`;
    renameFile(draggedFile.id, newPath, draggedFile.name);

    // If dragging a folder, move all children
    if (draggedFile.isFolder) {
      const children = files.filter((f) =>
        f.path.startsWith(draggedFile.path + "/")
      );
      children.forEach((child) => {
        const childNewPath = child.path.replace(draggedFile.path, newPath);
        renameFile(child.id, childNewPath, child.name);
      });
    }

    // Auto expand target folder
    if (!files.find((f) => f.path === targetFolder.path)) return;
    const expanded = getFileTree().find((n) => n.path === targetFolder.path);
    if (expanded && !expanded.isExpanded) {
      toggleFolder(targetFolder.path);
    }
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPath(null);
    const draggedId = e.dataTransfer.getData("text/plain");
    const draggedFile = files.find((f) => f.id === draggedId);
    if (!draggedFile) return;

    // Move to root
    renameFile(draggedFile.id, draggedFile.name, draggedFile.name);
    if (draggedFile.isFolder) {
      const children = files.filter((f) =>
        f.path.startsWith(draggedFile.path + "/")
      );
      children.forEach((child) => {
        const childNewPath = child.path.replace(
          draggedFile.path,
          draggedFile.name
        );
        renameFile(child.id, childNewPath, child.name);
      });
    }
  };

  const collapseAll = () => {
    files.forEach((f) => {
      if (f.isFolder) {
        const tree = getFileTree();
        const node = findNodeInTree(tree, f.path);
        if (node && node.isExpanded) toggleFolder(f.path);
      }
    });
  };

  const handleClearWorkspace = async () => {
    if (confirm("Clear all files in workspace and start fresh?")) {
      try {
        await fetch("/api/files", { method: "DELETE" });
        setFiles([]);
      } catch {}
    }
  };

  return (
    <div
      className="flex h-full w-full flex-col bg-[#18181b] text-zinc-300 select-none"
      onContextMenu={(e) => handleContextMenu(e)}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={handleDropOnRoot}
    >
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b border-zinc-800 px-3 text-xs font-semibold text-zinc-400 shrink-0">
        <span className="truncate uppercase tracking-wider">
          {projectName || "EXPLORER"}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleNewFile("")}
            title="New File"
            className="rounded p-1 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <FilePlus className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleNewFolder("")}
            title="New Folder"
            className="rounded p-1 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button
            onClick={syncFilesystem}
            title="Refresh Explorer"
            className="rounded p-1 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <button
            onClick={collapseAll}
            title="Collapse All"
            className="rounded p-1 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <FolderMinus className="h-4 w-4" />
          </button>
          <button
            onClick={handleClearWorkspace}
            title="Clear Workspace (Start Fresh)"
            className="rounded p-1 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Creating at root level */}
      {creatingIn && creatingIn.parentPath === "" && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900/80 border-b border-zinc-800 shrink-0">
          {creatingIn.isFolder ? (
            <Folder className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <FileCode className="h-3.5 w-3.5 text-blue-400" />
          )}
          <input
            autoFocus
            type="text"
            value={creatingName}
            onChange={(e) => setCreatingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmCreate();
              if (e.key === "Escape") setCreatingIn(null);
            }}
            onBlur={confirmCreate}
            placeholder={creatingIn.isFolder ? "Folder name..." : "File name..."}
            className="flex-1 bg-zinc-800 px-1.5 py-0.5 text-xs text-white outline-none rounded border border-blue-500/50"
          />
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1 text-xs">
        {files.length === 0 && !creatingIn ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-zinc-500 text-xs">
            <FolderInput className="h-8 w-8 text-zinc-600" />
            <p>No files in workspace.</p>
            <p className="text-[10px] text-zinc-600">
              Use the terminal to create files, or click{" "}
              <span className="text-zinc-400">+</span> above.
            </p>
          </div>
        ) : (
          <TreeNodeList
            nodes={fileTree}
            allFiles={files}
            depth={0}
            selectedPath={selectedPath}
            editingNodeId={editingNodeId}
            editingName={editingName}
            creatingIn={creatingIn}
            creatingName={creatingName}
            dragOverPath={dragOverPath}
            onFileClick={handleFileClick}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            setEditingName={setEditingName}
            setEditingNodeId={setEditingNodeId}
            confirmRename={confirmRename}
            setCreatingName={setCreatingName}
            setCreatingIn={setCreatingIn}
            confirmCreate={confirmCreate}
          />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRename={handleRename}
          onDelete={handleDelete}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          hasCopied={!!clipboard}
        />
      )}
    </div>
  );
}

// ─── Recursive Tree Renderer ─────────────────────────────────────────────────

function TreeNodeList({
  nodes,
  allFiles,
  depth,
  selectedPath,
  editingNodeId,
  editingName,
  creatingIn,
  creatingName,
  dragOverPath,
  onFileClick,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  setEditingName,
  setEditingNodeId,
  confirmRename,
  setCreatingName,
  setCreatingIn,
  confirmCreate,
}: {
  nodes: FileTreeNode[];
  allFiles: ProjectFile[];
  depth: number;
  selectedPath: string | null;
  editingNodeId: string | null;
  editingName: string;
  creatingIn: { parentPath: string; isFolder: boolean } | null;
  creatingName: string;
  dragOverPath: string | null;
  onFileClick: (file: ProjectFile) => void;
  onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void;
  onDragStart: (e: React.DragEvent, node: FileTreeNode) => void;
  onDragOver: (e: React.DragEvent, node: FileTreeNode) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetFolder: FileTreeNode) => void;
  setEditingName: (n: string) => void;
  setEditingNodeId: (id: string | null) => void;
  confirmRename: (id: string, path: string) => void;
  setCreatingName: (n: string) => void;
  setCreatingIn: (v: { parentPath: string; isFolder: boolean } | null) => void;
  confirmCreate: () => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        const file = allFiles.find((f) => f.id === node.id);
        const isEditing = editingNodeId === node.id;
        const isSelected = selectedPath === node.path;
        const isDragOver = dragOverPath === node.path;
        const iconInfo = node.isFolder ? null : getFileIcon(node.name);
        const IconComp = iconInfo?.icon || FileType;

        return (
          <div key={node.id}>
            {/* Node Row */}
            <div
              draggable
              onDragStart={(e) => onDragStart(e, node)}
              onDragOver={(e) => onDragOver(e, node)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, node)}
              onClick={() => file && onFileClick(file)}
              onContextMenu={(e) => onContextMenu(e, node)}
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
              className={`
                group flex h-[22px] items-center gap-1 pr-2 cursor-pointer text-zinc-300
                transition-colors duration-75
                ${isSelected ? "bg-blue-500/15 text-white" : "hover:bg-zinc-800/60"}
                ${isDragOver ? "bg-blue-500/25 border border-blue-500/40 rounded" : ""}
              `}
            >
              {/* Folder chevron or file indent */}
              {node.isFolder ? (
                <span className="shrink-0 w-4 flex items-center justify-center">
                  {node.isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                  )}
                </span>
              ) : (
                <span className="shrink-0 w-4" />
              )}

              {/* Icon */}
              {node.isFolder ? (
                node.isExpanded ? (
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                ) : (
                  <Folder className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                )
              ) : (
                <IconComp className={`h-3.5 w-3.5 shrink-0 ${iconInfo?.color || "text-zinc-500"}`} />
              )}

              {/* Name or rename input */}
              {isEditing ? (
                <input
                  autoFocus
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmRename(node.id, node.path);
                    if (e.key === "Escape") setEditingNodeId(null);
                  }}
                  onBlur={() => confirmRename(node.id, node.path)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-zinc-800 px-1 text-xs text-white outline-none rounded border border-blue-500/50 min-w-0"
                />
              ) : (
                <span className="truncate text-[12px]">{node.name}</span>
              )}
            </div>

            {/* Children (if folder is expanded) */}
            {node.isFolder && node.isExpanded && (
              <div>
                {/* Inline create input inside this folder */}
                {creatingIn && creatingIn.parentPath === node.path && (
                  <div
                    className="flex items-center gap-1.5 py-0.5"
                    style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
                  >
                    {creatingIn.isFolder ? (
                      <Folder className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <FileCode className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    )}
                    <input
                      autoFocus
                      type="text"
                      value={creatingName}
                      onChange={(e) => setCreatingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmCreate();
                        if (e.key === "Escape") setCreatingIn(null);
                      }}
                      onBlur={confirmCreate}
                      placeholder={creatingIn.isFolder ? "Folder name..." : "File name..."}
                      className="flex-1 bg-zinc-800 px-1 text-xs text-white outline-none rounded border border-blue-500/50 min-w-0"
                    />
                  </div>
                )}

                {node.children && node.children.length > 0 && (
                  <TreeNodeList
                    nodes={node.children}
                    allFiles={allFiles}
                    depth={depth + 1}
                    selectedPath={selectedPath}
                    editingNodeId={editingNodeId}
                    editingName={editingName}
                    creatingIn={creatingIn}
                    creatingName={creatingName}
                    dragOverPath={dragOverPath}
                    onFileClick={onFileClick}
                    onContextMenu={onContextMenu}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    setEditingName={setEditingName}
                    setEditingNodeId={setEditingNodeId}
                    confirmRename={confirmRename}
                    setCreatingName={setCreatingName}
                    setCreatingIn={setCreatingIn}
                    confirmCreate={confirmCreate}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findNodeInTree(nodes: FileTreeNode[], path: string): FileTreeNode | null {
  for (const n of nodes) {
    if (n.path === path) return n;
    if (n.children) {
      const found = findNodeInTree(n.children, path);
      if (found) return found;
    }
  }
  return null;
}
