// ─── Model Context Protocol (MCP) Types ─────────────────────────────────────────

export type MCPServerTransport = "stdio" | "sse" | "builtin";

export type MCPServerStatus = "connected" | "connecting" | "disconnected" | "error";

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  serverId: string;
  inputSchema?: {
    type?: string;
    properties?: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  transport: MCPServerTransport;
  status: MCPServerStatus;
  enabled: boolean;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  tools: MCPTool[];
  lastConnectedAt?: string;
  error?: string;
}

export interface MCPToolCallPayload {
  serverId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface MCPToolCallResult {
  success: boolean;
  output: unknown;
  error?: string;
  executionTimeMs?: number;
}
