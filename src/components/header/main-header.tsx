"use client";

import { useRef } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { executeCode } from "@/lib/execution/runner";
import { getLanguageFromPath } from "@/lib/utils";
import {
  Sparkles,
  Play,
  Globe,
  Settings,
  FilePlus,
  FolderOpen,
  FileText,
  Save,
  Check,
  X,
  Copy,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MainHeader() {
  const {
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleBottomPanel,
    toggleLiveServer,
    setSettingsDialogOpen,
    appSettings,
    updateAppSettings,
    addConsoleOutput,
    setBottomPanelTab,
    addLog,
  } = useSettingsStore();

  const { activeTabId, tabs, markTabClean, closeAllTabs, closeTab, openTab } = useEditorStore();
  const { files, addFile, updateFileContent, projectName, setFiles } = useProjectStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // New File
  const handleNewFile = () => {
    const name = `file-${Date.now().toString().slice(-4)}.js`;
    const newFile = {
      id: crypto.randomUUID(),
      projectId: "default",
      path: name,
      name: name,
      content: "// New file\n",
      language: "javascript",
      isFolder: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addFile(newFile);
    openTab({
      id: newFile.id,
      fileId: newFile.id,
      path: newFile.path,
      name: newFile.name,
      language: newFile.language,
      content: newFile.content,
    });
  };

  // Open Local File
  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || "";
        const newFile = {
          id: crypto.randomUUID(),
          projectId: "default",
          path: file.name,
          name: file.name,
          content,
          language: getLanguageFromPath(file.name),
          isFolder: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addFile(newFile);
        openTab({
          id: newFile.id,
          fileId: newFile.id,
          path: newFile.path,
          name: newFile.name,
          language: newFile.language,
          content: newFile.content,
        });
        addLog(`Opened file: ${file.name}`, "success");
      };
      reader.readAsText(file);
    });
  };

  // Open Local Folder
  const handleOpenFolderClick = async () => {
    try {
      // Modern Web Directory Picker API
      if ("showDirectoryPicker" in window) {
        const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
        const newFiles: typeof files = [];

        async function readEntries(handle: FileSystemDirectoryHandle, currentPath = "") {
          for await (const entry of (handle as unknown as AsyncIterable<FileSystemHandle>)) {
            if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
            const entryRelativePath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            if (entry.kind === "directory") {
              newFiles.push({
                id: entryRelativePath,
                projectId: "default",
                path: entryRelativePath,
                name: entry.name,
                content: "",
                language: "plaintext",
                isFolder: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              await readEntries(entry as unknown as FileSystemDirectoryHandle, entryRelativePath);
            } else if (entry.kind === "file") {
              const fileObj = await (entry as unknown as FileSystemFileHandle).getFile();
              if (fileObj.size < 500000) {
                const text = await fileObj.text();
                newFiles.push({
                  id: entryRelativePath,
                  projectId: "default",
                  path: entryRelativePath,
                  name: entry.name,
                  content: text,
                  language: getLanguageFromPath(entry.name),
                  isFolder: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }
            }
          }
        }

        await readEntries(dirHandle);
        if (newFiles.length > 0) {
          setFiles(newFiles);
          addLog(`Opened folder: ${dirHandle.name}`, "success");
        }
      } else {
        folderInputRef.current?.click();
      }
    } catch {
      folderInputRef.current?.click();
    }
  };

  // Save
  const handleSave = () => {
    if (!activeTab) return;
    updateFileContent(activeTab.fileId, activeTab.content);
    markTabClean(activeTab.id);
    addLog(`Saved file: ${activeTab.name}`, "info");
  };

  // Save As...
  const handleSaveAs = () => {
    if (!activeTab) return;
    const blob = new Blob([activeTab.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeTab.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Save All
  const handleSaveAll = () => {
    tabs.forEach((tab) => {
      updateFileContent(tab.fileId, tab.content);
      markTabClean(tab.id);
    });
    addLog("Saved all open files", "info");
  };

  // Run Code
  const handleRunCode = () => {
    if (!activeTab) return;
    const targetFile = files.find((f) => f.id === activeTab.fileId);
    if (!targetFile) return;

    updateFileContent(activeTab.fileId, activeTab.content);
    markTabClean(activeTab.id);

    setBottomPanelTab("console");
    const res = executeCode(targetFile.name, activeTab.content, activeTab.language);
    addConsoleOutput(
      `$ Executing ${targetFile.name} (${res.executionTimeMs}ms)\n${res.output}`,
      res.success ? "log" : "error"
    );
  };

  return (
    <div className="flex h-8 w-full items-center justify-between border-b border-zinc-800/80 bg-[#141417] px-2 text-xs text-zinc-300 select-none shrink-0 z-20">
      {/* Hidden File Inputs for Local Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileChange}
        // @ts-expect-error webkitdirectory is standard for folder picker
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />

      {/* Left Top Menu Bar (File, Edit, Selection, View, Go, Run, Terminal, Help) */}
      <div className="flex items-center gap-1">
        {/* Brand logo */}
        <div className="flex items-center gap-1.5 px-2 py-1 font-bold text-white tracking-wide">
          <div className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <Sparkles className="h-2.5 w-2.5" />
          </div>
          <span className="text-[11px] bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            AI Code Studio
          </span>
        </div>

        {/* File Menu (Matching Screenshot 3) */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white outline-none">
            File
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200">
            <DropdownMenuItem onClick={handleNewFile} className="text-xs hover:bg-zinc-800">
              <FilePlus className="h-3.5 w-3.5 mr-2 text-blue-400" /> New Text File
              <span className="ml-auto text-[10px] text-zinc-500">⌘N</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenFileClick} className="text-xs hover:bg-zinc-800">
              <FileText className="h-3.5 w-3.5 mr-2 text-indigo-400" /> Open File...
              <span className="ml-auto text-[10px] text-zinc-500">⌘O</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenFolderClick} className="text-xs hover:bg-zinc-800">
              <FolderOpen className="h-3.5 w-3.5 mr-2 text-amber-400" /> Open Folder...
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-zinc-800" />

            <DropdownMenuItem onClick={handleSave} className="text-xs hover:bg-zinc-800">
              <Save className="h-3.5 w-3.5 mr-2 text-emerald-400" /> Save
              <span className="ml-auto text-[10px] text-zinc-500">⌘S</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSaveAs} className="text-xs hover:bg-zinc-800">
              Save As...
              <span className="ml-auto text-[10px] text-zinc-500">⇧⌘S</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSaveAll} className="text-xs hover:bg-zinc-800">
              Save All
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-zinc-800" />

            <DropdownMenuItem
              onClick={() => updateAppSettings({ autoSave: !appSettings.autoSave })}
              className="text-xs hover:bg-zinc-800 justify-between"
            >
              <span>Auto Save</span>
              {appSettings.autoSave && <Check className="h-3.5 w-3.5 text-blue-400" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-zinc-800" />

            <DropdownMenuItem
              onClick={() => activeTab && closeTab(activeTab.id)}
              className="text-xs hover:bg-zinc-800"
            >
              Close Editor <span className="ml-auto text-[10px] text-zinc-500">⌘W</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={closeAllTabs} className="text-xs hover:bg-zinc-800 text-rose-400">
              Close All Tabs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white outline-none">
            Edit
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-zinc-900 border-zinc-800 text-zinc-200">
            <DropdownMenuItem className="text-xs hover:bg-zinc-800">
              Undo <span className="ml-auto text-[10px] text-zinc-500">⌘Z</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs hover:bg-zinc-800">
              Redo <span className="ml-auto text-[10px] text-zinc-500">⇧⌘Z</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="text-xs hover:bg-zinc-800">
              <Copy className="h-3.5 w-3.5 mr-2" /> Cut <span className="ml-auto text-[10px] text-zinc-500">⌘X</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs hover:bg-zinc-800">
              Copy <span className="ml-auto text-[10px] text-zinc-500">⌘C</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs hover:bg-zinc-800">
              Paste <span className="ml-auto text-[10px] text-zinc-500">⌘V</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Selection Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white outline-none">
            Selection
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-zinc-900 border-zinc-800 text-zinc-200">
            <DropdownMenuItem className="text-xs hover:bg-zinc-800">
              Select All <span className="ml-auto text-[10px] text-zinc-500">⌘A</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs hover:bg-zinc-800">Expand Selection</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white outline-none">
            View
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 bg-zinc-900 border-zinc-800 text-zinc-200">
            <DropdownMenuItem onClick={toggleLeftSidebar} className="text-xs hover:bg-zinc-800">
              Toggle Left Explorer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleRightSidebar} className="text-xs hover:bg-zinc-800">
              Toggle AI Assistant
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleBottomPanel} className="text-xs hover:bg-zinc-800">
              Toggle Terminal Panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleLiveServer} className="text-xs hover:bg-zinc-800">
              Toggle Live Server
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Go Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white outline-none">
            Go
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-zinc-900 border-zinc-800 text-zinc-200">
            <DropdownMenuItem className="text-xs hover:bg-zinc-800">
              <Search className="h-3.5 w-3.5 mr-2" /> Go to File... <span className="ml-auto text-[10px] text-zinc-500">⌘P</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Run Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white outline-none">
            Run
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-zinc-900 border-zinc-800 text-zinc-200">
            <DropdownMenuItem onClick={handleRunCode} className="text-xs hover:bg-zinc-800 text-emerald-400">
              <Play className="h-3.5 w-3.5 mr-2" /> Run Code
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleLiveServer} className="text-xs hover:bg-zinc-800 text-blue-400">
              <Globe className="h-3.5 w-3.5 mr-2" /> Open Live Server
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white outline-none">
            Help
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 bg-zinc-900 border-zinc-800 text-zinc-200">
            <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)} className="text-xs hover:bg-zinc-800">
              <Settings className="h-3.5 w-3.5 mr-2 text-zinc-400" /> API Key Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Project name display */}
      <div className="text-[11px] text-zinc-500 font-medium">
        {projectName || "AI Code Studio"} — Workspace
      </div>
    </div>
  );
}
