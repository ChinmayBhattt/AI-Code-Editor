"use client";

import { useState } from "react";
import { useMCPStore } from "@/stores/mcp-store";
import type { MCPServerTransport } from "@/types/mcp";
import {
  Cpu,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Power,
  Terminal,
  Globe,
  Database,
  Search,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Wrench,
} from "lucide-react";

export function MCPSettingsPanel() {
  const {
    servers,
    addServer,
    removeServer,
    toggleServer,
    setServerStatus,
  } = useMCPStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [transport, setTransport] = useState<MCPServerTransport>("stdio");
  const [command, setCommand] = useState("npx");
  const [argsStr, setArgsStr] = useState("");
  const [url, setUrl] = useState("");

  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const args = argsStr
      .split(" ")
      .map((a) => a.trim())
      .filter(Boolean);

    addServer({
      name: name.trim(),
      description: description.trim() || "Custom Model Context Protocol Server",
      transport,
      enabled: true,
      command: transport === "stdio" ? command.trim() : undefined,
      args: transport === "stdio" ? args : undefined,
      url: transport === "sse" ? url.trim() : undefined,
    });

    setName("");
    setDescription("");
    setArgsStr("");
    setUrl("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5 text-zinc-300">
      {/* Header banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-900 border border-cyan-500/20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Model Context Protocol (MCP)
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Connect external AI tools, databases, command-line utilities, and APIs
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add MCP Server
        </button>
      </div>

      {/* Add Server Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateServer}
          className="p-4 rounded-xl bg-zinc-900/90 border border-cyan-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <h4 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
            Configure New MCP Server
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">
                Server Name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Postgres MCP"
                className="w-full mt-1 rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-cyan-500/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">
                Transport Type
              </label>
              <select
                value={transport}
                onChange={(e) => setTransport(e.target.value as MCPServerTransport)}
                className="w-full mt-1 rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-cyan-500/40"
              >
                <option value="stdio">stdio (Command / Executable)</option>
                <option value="sse">SSE (Server-Sent Events URL)</option>
                <option value="builtin">Built-in Extension</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What tools or data does this MCP server provide?"
              className="w-full mt-1 rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-cyan-500/40"
            />
          </div>

          {transport === "stdio" && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-zinc-400 uppercase">
                  Executable Command
                </label>
                <input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="npx"
                  className="w-full mt-1 rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-cyan-500/40 font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase">
                  Arguments (space separated)
                </label>
                <input
                  value={argsStr}
                  onChange={(e) => setArgsStr(e.target.value)}
                  placeholder="-y @modelcontextprotocol/server-postgres"
                  className="w-full mt-1 rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-cyan-500/40 font-mono"
                />
              </div>
            </div>
          )}

          {transport === "sse" && (
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">
                SSE Endpoint URL
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:8080/sse"
                className="w-full mt-1 rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-cyan-500/40 font-mono"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
            >
              Save Server
            </button>
          </div>
        </form>
      )}

      {/* Connected Servers List */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          Active MCP Servers ({servers.length})
          <span className="text-[10px] text-zinc-500 normal-case font-normal">
            Toggle or add servers to grant tools to AI Assistant & Workflows
          </span>
        </h4>

        <div className="space-y-2">
          {servers.map((server) => {
            const isConnected = server.status === "connected";

            return (
              <div
                key={server.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  server.enabled
                    ? "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80"
                    : "bg-zinc-950/40 border-zinc-900 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 mt-0.5 border ${
                        isConnected
                          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-500"
                      }`}
                    >
                      <Cpu className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold text-zinc-200">
                          {server.name}
                        </h5>
                        <span
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${
                            isConnected
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {server.status.toUpperCase()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-500 bg-zinc-800/60 uppercase">
                          {server.transport}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 mt-1">
                        {server.description}
                      </p>

                      {/* Commands or URL */}
                      {server.command && (
                        <div className="mt-1.5 text-[10px] font-mono text-cyan-400/80 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800/60 inline-flex items-center gap-1.5">
                          <Terminal className="h-3 w-3 text-zinc-500" />
                          {server.command} {server.args?.join(" ")}
                        </div>
                      )}

                      {/* Tools Exposed */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                          <Wrench className="h-2.5 w-2.5 text-cyan-400" />
                          Tools ({server.tools.length}):
                        </span>
                        {server.tools.map((t) => (
                          <span
                            key={t.id}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-mono border border-zinc-700/50"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleServer(server.id)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        server.enabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300"
                      }`}
                      title={server.enabled ? "Disable Server" : "Enable Server"}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    {!DEFAULT_PRESET_SERVERS.some((p) => p.id === server.id) && (
                      <button
                        onClick={() => removeServer(server.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-all"
                        title="Delete Server"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_PRESET_SERVERS = [
  { id: "mcp-github" },
  { id: "mcp-sqlite" },
  { id: "mcp-brave-search" },
  { id: "mcp-filesystem" },
];
