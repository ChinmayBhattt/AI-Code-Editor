import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MCPServer, MCPTool, MCPToolCallPayload, MCPToolCallResult } from "@/types/mcp";

interface MCPState {
  servers: MCPServer[];
  activeServerId: string | null;

  // Server management
  addServer: (server: Omit<MCPServer, "id" | "status" | "tools">) => void;
  updateServer: (id: string, updates: Partial<MCPServer>) => void;
  removeServer: (id: string) => void;
  toggleServer: (id: string) => void;
  setServerStatus: (id: string, status: MCPServer["status"], error?: string) => void;

  // Tool execution
  executeTool: (payload: MCPToolCallPayload) => Promise<MCPToolCallResult>;

  // Helpers
  getEnabledTools: () => MCPTool[];
  getActiveServers: () => MCPServer[];
}

const DEFAULT_PRESET_SERVERS: MCPServer[] = [
  {
    id: "mcp-github",
    name: "GitHub MCP Server",
    description: "Search repos, create issues, manage PRs, and read commits via GitHub API",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    status: "connected",
    enabled: true,
    tools: [
      {
        id: "github-create-issue",
        name: "create_issue",
        description: "Create a new issue in a GitHub repository",
        serverId: "mcp-github",
        inputSchema: {
          properties: {
            owner: { type: "string", description: "Repository owner" },
            repo: { type: "string", description: "Repository name" },
            title: { type: "string", description: "Issue title" },
            body: { type: "string", description: "Issue body content" },
          },
          required: ["owner", "repo", "title"],
        },
      },
      {
        id: "github-list-prs",
        name: "list_pull_requests",
        description: "List open pull requests for a repository",
        serverId: "mcp-github",
        inputSchema: {
          properties: {
            owner: { type: "string" },
            repo: { type: "string" },
            state: { type: "string" },
          },
        },
      },
    ],
  },
  {
    id: "mcp-sqlite",
    name: "SQLite Database MCP",
    description: "Query, inspect schemas, and execute SQL statements on SQLite databases",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sqlite"],
    status: "connected",
    enabled: true,
    tools: [
      {
        id: "sqlite-query",
        name: "sqlite_query",
        description: "Execute SELECT query on connected database",
        serverId: "mcp-sqlite",
        inputSchema: {
          properties: {
            query: { type: "string", description: "SQL Query string" },
          },
          required: ["query"],
        },
      },
      {
        id: "sqlite-list-tables",
        name: "list_tables",
        description: "List all database tables and schema structures",
        serverId: "mcp-sqlite",
      },
    ],
  },
  {
    id: "mcp-brave-search",
    name: "Brave Search MCP",
    description: "Perform real-time web search and extract web page summaries",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    status: "connected",
    enabled: true,
    tools: [
      {
        id: "brave-web-search",
        name: "web_search",
        description: "Search the web using Brave Search API",
        serverId: "mcp-brave-search",
        inputSchema: {
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
      },
    ],
  },
  {
    id: "mcp-filesystem",
    name: "Filesystem MCP Server",
    description: "Read, write, list directories, and search local files safely",
    transport: "builtin",
    status: "connected",
    enabled: true,
    tools: [
      {
        id: "fs-read-file",
        name: "read_file",
        description: "Read content of a file",
        serverId: "mcp-filesystem",
      },
      {
        id: "fs-list-dir",
        name: "list_directory",
        description: "List directory contents",
        serverId: "mcp-filesystem",
      },
    ],
  },
];

export const useMCPStore = create<MCPState>()(
  persist(
    (set, get) => ({
      servers: DEFAULT_PRESET_SERVERS,
      activeServerId: null,

      addServer: (serverData) => {
        const newServer: MCPServer = {
          ...serverData,
          id: `mcp-custom-${crypto.randomUUID().slice(0, 6)}`,
          status: "connected",
          tools: [
            {
              id: `tool-custom-query-${crypto.randomUUID().slice(0, 4)}`,
              name: "custom_action",
              description: `Custom action for ${serverData.name}`,
              serverId: `mcp-custom-${crypto.randomUUID().slice(0, 6)}`,
            },
          ],
        };

        set((state) => ({
          servers: [...state.servers, newServer],
        }));
      },

      updateServer: (id, updates) => {
        set((state) => ({
          servers: state.servers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },

      removeServer: (id) => {
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== id),
        }));
      },

      toggleServer: (id) => {
        set((state) => ({
          servers: state.servers.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
        }));
      },

      setServerStatus: (id, status, error) => {
        set((state) => ({
          servers: state.servers.map((s) => (s.id === id ? { ...s, status, error } : s)),
        }));
      },

      executeTool: async (payload) => {
        const startTime = Date.now();
        const { serverId, toolName, args } = payload;
        const server = get().servers.find((s) => s.id === serverId);

        if (!server || !server.enabled) {
          return {
            success: false,
            output: null,
            error: `MCP Server "${serverId}" is not found or disabled.`,
            executionTimeMs: Date.now() - startTime,
          };
        }

        // Simulate tool execution with structured mock results
        let output: unknown = null;
        if (toolName === "create_issue") {
          output = {
            issueNumber: Math.floor(Math.random() * 50) + 10,
            title: args.title || "New Issue",
            state: "open",
            url: `https://github.com/${args.owner || "user"}/${args.repo || "repo"}/issues/42`,
            createdAt: new Date().toISOString(),
          };
        } else if (toolName === "sqlite_query") {
          output = {
            rows: [
              { id: 1, name: "Alice", role: "admin", created_at: "2026-01-01" },
              { id: 2, name: "Bob", role: "developer", created_at: "2026-01-15" },
            ],
            rowCount: 2,
            query: args.query,
          };
        } else if (toolName === "web_search") {
          output = {
            results: [
              { title: `Search result for ${args.query}`, url: "https://example.com/info", snippet: "High relevance search response." },
            ],
          };
        } else {
          output = {
            status: "EXECUTED",
            server: server.name,
            tool: toolName,
            args,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          output,
          executionTimeMs: Date.now() - startTime,
        };
      },

      getEnabledTools: () => {
        return get()
          .servers.filter((s) => s.enabled && s.status === "connected")
          .flatMap((s) => s.tools);
      },

      getActiveServers: () => {
        return get().servers.filter((s) => s.enabled);
      },
    }),
    {
      name: "ai-code-studio-mcp",
      partialize: (state) => ({
        servers: state.servers,
      }),
    }
  )
);
