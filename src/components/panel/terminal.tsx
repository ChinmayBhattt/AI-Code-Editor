"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useProjectStore } from "@/stores/project-store";
import {
  Plus,
  X,
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  RotateCcw,
  Columns2,
  ChevronDown,
  Trash2,
} from "lucide-react";

interface TerminalTab {
  id: string;
  name: string;
  ws: WebSocket | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  terminal: any;
  connected: boolean;
}

const PTY_WS_URL = "ws://localhost:3002";

export function RealTerminal() {
  const { setFiles } = useProjectStore();
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showShellMenu, setShowShellMenu] = useState(false);
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const terminalsRef = useRef<Map<string, TerminalTab>>(new Map());
  const fitAddonsRef = useRef<Map<string, unknown>>(new Map());
  const initRef = useRef(false);

  // Sync explorer files after terminal commands
  const syncFilesystem = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch {}
  }, [setFiles]);

  // Create a new terminal tab
  const createTerminal = useCallback(
    async (name?: string) => {
      const id = `term-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const tabName = name || `zsh`;

      // Dynamically import xterm (client-side only)
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      // Import xterm CSS
      await import("@xterm/xterm/css/xterm.css");

      const terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: "bar",
        cursorWidth: 2,
        fontSize: 13,
        fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', Menlo, Monaco, monospace",
        fontWeight: "400",
        fontWeightBold: "600",
        lineHeight: 1.35,
        letterSpacing: 0,
        theme: {
          background: "#0d0d0f",
          foreground: "#e4e4e7",
          cursor: "#a78bfa",
          cursorAccent: "#0d0d0f",
          selectionBackground: "#6366f150",
          selectionForeground: "#ffffff",
          selectionInactiveBackground: "#6366f130",
          black: "#18181b",
          red: "#fb7185",
          green: "#34d399",
          yellow: "#fbbf24",
          blue: "#60a5fa",
          magenta: "#c084fc",
          cyan: "#22d3ee",
          white: "#e4e4e7",
          brightBlack: "#52525b",
          brightRed: "#fda4af",
          brightGreen: "#6ee7b7",
          brightYellow: "#fde68a",
          brightBlue: "#93c5fd",
          brightMagenta: "#d8b4fe",
          brightCyan: "#67e8f9",
          brightWhite: "#fafafa",
        },
        allowProposedApi: true,
        scrollback: 10000,
        convertEol: true,
        rightClickSelectsWord: true,
        drawBoldTextInBrightColors: true,
        minimumContrastRatio: 4.5,
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(new WebLinksAddon());

      fitAddonsRef.current.set(id, fitAddon);

      // Create WebSocket connection with auto-healing and reconnect retry
      const connectSocket = () => {
        // Trigger auto-heal of PTY server via API
        fetch("/api/terminal").catch(() => {});

        try {
          const ws = new WebSocket(PTY_WS_URL);

          ws.onopen = () => {
            setTabs((prev) =>
              prev.map((t) => (t.id === id ? { ...t, connected: true, ws } : t))
            );
            const tabRef = terminalsRef.current.get(id);
            if (tabRef) {
              tabRef.connected = true;
              tabRef.ws = ws;
            }
          };

          ws.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data);
              switch (msg.type) {
                case "output":
                  terminal.write(msg.data);
                  // Debounce filesystem sync
                  const win = window as unknown as Record<string, unknown>;
                  clearTimeout(win[`__fsSync_${id}`] as ReturnType<typeof setTimeout>);
                  win[`__fsSync_${id}`] = setTimeout(() => {
                    syncFilesystem();
                  }, 500);
                  break;
                case "ready":
                  break;
                case "exit":
                  terminal.write(
                    `\r\n\x1b[90m[Process exited with code ${msg.exitCode}]\x1b[0m\r\n`
                  );
                  break;
              }
            } catch {}
          };

          ws.onclose = () => {
            setTabs((prev) =>
              prev.map((t) => (t.id === id ? { ...t, connected: false } : t))
            );
            const tabRef = terminalsRef.current.get(id);
            if (tabRef) tabRef.connected = false;

            // Auto retry reconnect after 1.5 seconds if tab still exists
            setTimeout(() => {
              if (terminalsRef.current.has(id)) {
                const reSocket = connectSocket();
                if (reSocket) {
                  const currentTab = terminalsRef.current.get(id);
                  if (currentTab) currentTab.ws = reSocket;
                }
              }
            }, 1500);
          };

          ws.onerror = () => {
            setTabs((prev) =>
              prev.map((t) => (t.id === id ? { ...t, connected: false } : t))
            );
          };

          return ws;
        } catch {
          return null;
        }
      };

      const ws = connectSocket();

      const newTab: TerminalTab = {
        id,
        name: tabName,
        ws,
        terminal,
        connected: false,
      };

      // Terminal input → WebSocket → PTY
      terminal.onData((data: string) => {
        const currentWs = terminalsRef.current.get(id)?.ws;
        if (currentWs && currentWs.readyState === WebSocket.OPEN) {
          currentWs.send(JSON.stringify({ type: "input", data }));
        }
      });

      // Handle resize
      terminal.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        const currentWs = terminalsRef.current.get(id)?.ws;
        if (currentWs && currentWs.readyState === WebSocket.OPEN) {
          currentWs.send(JSON.stringify({ type: "resize", cols, rows }));
        }
      });

      terminalsRef.current.set(id, newTab);
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(id);

      return id;
    },
    [syncFilesystem]
  );

  // Attach terminal to DOM when active tab changes
  useEffect(() => {
    if (!activeTabId) return;

    const tab = terminalsRef.current.get(activeTabId);
    const container = containerRefs.current.get(activeTabId);

    if (tab && container && !container.querySelector(".xterm")) {
      tab.terminal.open(container);

      const fitAddon = fitAddonsRef.current.get(activeTabId) as {
        fit: () => void;
      };
      if (fitAddon) {
        setTimeout(() => {
          try {
            fitAddon.fit();
          } catch {}
        }, 50);
      }

      tab.terminal.focus();
    } else if (tab && container && container.querySelector(".xterm")) {
      // Already opened, just fit and focus
      const fitAddon = fitAddonsRef.current.get(activeTabId) as {
        fit: () => void;
      };
      if (fitAddon) {
        try {
          fitAddon.fit();
        } catch {}
      }
      tab.terminal.focus();
    }
  }, [activeTabId]);

  // Auto-resize on window resize
  useEffect(() => {
    const handleResize = () => {
      if (activeTabId) {
        const fitAddon = fitAddonsRef.current.get(activeTabId) as {
          fit: () => void;
        };
        if (fitAddon) {
          try {
            fitAddon.fit();
          } catch {}
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // Use ResizeObserver for more precise container resizing
    const observer = new ResizeObserver(() => {
      handleResize();
    });

    if (activeTabId) {
      const container = containerRefs.current.get(activeTabId);
      if (container) {
        observer.observe(container);
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [activeTabId]);

  // Create first terminal on mount
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      createTerminal();
    }
  }, [createTerminal]);

  // Close a terminal tab
  const closeTab = useCallback(
    (id: string) => {
      const tab = terminalsRef.current.get(id);
      if (tab) {
        tab.ws?.close();
        tab.terminal.dispose();
        terminalsRef.current.delete(id);
        fitAddonsRef.current.delete(id);
      }

      setTabs((prev) => {
        const remaining = prev.filter((t) => t.id !== id);
        if (remaining.length === 0) {
          // Create a new terminal if all closed
          setTimeout(() => createTerminal(), 100);
        } else if (activeTabId === id) {
          setActiveTabId(remaining[remaining.length - 1].id);
        }
        return remaining;
      });
    },
    [activeTabId, createTerminal]
  );

  // Kill and restart terminal
  const restartTerminal = useCallback(
    (id: string) => {
      closeTab(id);
      setTimeout(() => createTerminal(), 200);
    },
    [closeTab, createTerminal]
  );

  // Clear terminal screen
  const clearTerminal = useCallback(() => {
    if (activeTabId) {
      const tab = terminalsRef.current.get(activeTabId);
      if (tab) {
        tab.terminal.clear();
        tab.terminal.write("\x1b[2J\x1b[H");
        if (tab.ws?.readyState === WebSocket.OPEN) {
          tab.ws.send(JSON.stringify({ type: "input", data: "clear\n" }));
        }
      }
    }
  }, [activeTabId]);

  // Set container ref for a terminal
  const setContainerRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) {
        containerRefs.current.set(id, el);
      }
    },
    []
  );

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#0d0d0f] overflow-hidden ${
        isMaximized ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Terminal Tab Bar */}
      <div className="flex h-[30px] items-center justify-between bg-[#18181b] border-b border-zinc-800/70 px-1 shrink-0">
        {/* Tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto min-w-0 flex-1 scrollbar-hide">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 cursor-pointer text-[11px] font-medium rounded-t-sm transition-all duration-150 whitespace-nowrap select-none ${
                activeTabId === tab.id
                  ? "bg-[#0d0d0f] text-zinc-100 border-t border-x border-zinc-700/50"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <TerminalIcon className="h-3 w-3 text-blue-400 shrink-0" />
              <span className="flex items-center gap-1">
                {tab.name}
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    tab.connected ? "bg-emerald-400" : "bg-zinc-600"
                  }`}
                />
              </span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded p-0.5 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0 ml-2">
          {/* New Terminal */}
          <button
            onClick={() => createTerminal()}
            title="New Terminal"
            className="p-1 hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-200 rounded transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          {/* Split Terminal (creates new tab) */}
          <button
            onClick={() => createTerminal("zsh")}
            title="Split Terminal"
            className="p-1 hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-200 rounded transition-colors"
          >
            <Columns2 className="h-3.5 w-3.5" />
          </button>

          {/* Shell dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowShellMenu(!showShellMenu)}
              title="Select Shell"
              className="p-1 hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-200 rounded transition-colors flex items-center gap-0.5"
            >
              <span className="text-[10px]">zsh</span>
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
            {showShellMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowShellMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl py-1 min-w-[140px]">
                  {[
                    { name: "zsh", icon: "🐚" },
                    { name: "bash", icon: "💲" },
                    { name: "sh", icon: "📟" },
                  ].map((sh) => (
                    <button
                      key={sh.name}
                      onClick={() => {
                        createTerminal(sh.name);
                        setShowShellMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <span>{sh.icon}</span>
                      <span>{sh.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Clear */}
          <button
            onClick={clearTerminal}
            title="Clear Terminal"
            className="p-1 hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-200 rounded transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Restart */}
          <button
            onClick={() => activeTabId && restartTerminal(activeTabId)}
            title="Restart Terminal"
            className="p-1 hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-200 rounded transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Maximize / Minimize */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Minimize" : "Maximize"}
            className="p-1 hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-200 rounded transition-colors"
          >
            {isMaximized ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`absolute inset-0 ${
              activeTabId === tab.id ? "visible" : "invisible"
            }`}
          >
            <div
              ref={setContainerRef(tab.id)}
              className="w-full h-full terminal-container"
              style={{ padding: "4px 8px 4px 8px" }}
            />
          </div>
        ))}

        {/* Fallback when no tabs */}
        {tabs.length === 0 && (
          <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
            <button
              onClick={() => createTerminal()}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/60 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Terminal
            </button>
          </div>
        )}

        {/* Connection status overlay */}
        {activeTab && !activeTab.connected && (
          <div className="absolute top-2 right-2 flex items-center gap-2 px-2.5 py-1 bg-amber-950/80 border border-amber-600/50 rounded-md text-[10px] text-amber-200 shadow-md">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Disconnected</span>
            <button
              onClick={() => restartTerminal(activeTab.id)}
              className="px-1.5 py-0.5 bg-amber-800/60 hover:bg-amber-700/80 text-amber-100 rounded text-[9px] font-semibold transition-colors"
            >
              Reconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
