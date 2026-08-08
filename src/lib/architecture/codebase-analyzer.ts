import { ArchitectureNode3D, ArchitectureConnection3D } from "@/stores/architecture-3d-store";

export function generateDefaultArchitecture(): {
  nodes: ArchitectureNode3D[];
  connections: ArchitectureConnection3D[];
} {
  const nodes: ArchitectureNode3D[] = [
    {
      id: "frontend",
      name: "Frontend UI Layer",
      type: "frontend",
      filePath: "src/app/page.tsx",
      position: [-8, 2, 0],
      size: [4, 5, 4],
      color: "#3b82f6", // Vibrant Blue
      status: "healthy",
      description: "Next.js App Router, Monaco Editor, Tailwind CSS, Framer Motion UI Components",
      connections: ["api-gateway", "state-store", "browser-agent"],
      metrics: { filesCount: 14, linesOfCode: 1850, dependencies: 12 },
    },
    {
      id: "api-gateway",
      name: "API Gateway & Router",
      type: "api",
      filePath: "src/app/api/chat/route.ts",
      position: [-2, 2.5, -4],
      size: [3.5, 6, 3.5],
      color: "#8b5cf6", // Purple Glow
      status: "healthy",
      description: "REST & Vercel AI SDK Edge Endpoints, Chat Streaming, PTY Proxy",
      connections: ["auth-service", "backend-server", "ai-providers"],
      metrics: { filesCount: 6, linesOfCode: 720, dependencies: 5 },
    },
    {
      id: "auth-service",
      name: "Authentication & Security",
      type: "auth",
      filePath: "src/types/project.ts",
      position: [4, 1.5, -4],
      size: [3, 4, 3],
      color: "#10b981", // Emerald
      status: "healthy",
      description: "Session Verification, API Key Protection, User Permissions & Security Rules",
      connections: ["database"],
      metrics: { filesCount: 4, linesOfCode: 430, dependencies: 3 },
    },
    {
      id: "database",
      name: "Database & Storage",
      type: "database",
      filePath: "prisma/schema.prisma",
      position: [8, 3, 0],
      size: [4.5, 7, 4.5],
      color: "#f59e0b", // Amber Gold
      status: "warning",
      description: "PostgreSQL & SQLite Storage, Prisma Schemas, User Workspace History",
      connections: [],
      metrics: { filesCount: 5, linesOfCode: 610, dependencies: 4 },
    },
    {
      id: "backend-server",
      name: "Backend Node & PTY Server",
      type: "backend",
      filePath: "server/pty-server.mjs",
      position: [2, 2, 4],
      size: [3.8, 5.5, 3.8],
      color: "#ec4899", // Pink Cyan
      status: "healthy",
      description: "Node-PTY Terminal Websocket Server, Shell Process Runner, Command Execution",
      connections: ["database"],
      metrics: { filesCount: 3, linesOfCode: 380, dependencies: 4 },
    },
    {
      id: "state-store",
      name: "Zustand State Engine",
      type: "store",
      filePath: "src/stores/editor-store.ts",
      position: [-5, 1.5, 5],
      size: [3.2, 4, 3.2],
      color: "#06b6d4", // Cyan
      status: "healthy",
      description: "Global Editor Tabs, Terminal Logs, Settings, MCP Server State",
      connections: ["frontend"],
      metrics: { filesCount: 8, linesOfCode: 950, dependencies: 2 },
    },
    {
      id: "browser-agent",
      name: "AI Browser Agent Engine",
      type: "service",
      filePath: "src/lib/browser/browser-agent-executor.ts",
      position: [-10, 1.8, -6],
      size: [3, 4.5, 3],
      color: "#6366f1", // Indigo
      status: "healthy",
      description: "Autonomous Web Testing Engine, DOM Inspection, Bug Auto-Fixing",
      connections: ["api-gateway"],
      metrics: { filesCount: 3, linesOfCode: 540, dependencies: 3 },
    },
    {
      id: "ai-providers",
      name: "AI LLM Multi-Model Engine",
      type: "service",
      filePath: "src/lib/ai/providers.ts",
      position: [3, 2, -9],
      size: [3.5, 5, 3.5],
      color: "#f43f5e", // Rose Red
      status: "healthy",
      description: "Google Gemini, Groq Llama 3.3 70B, Claude, DeepSeek Model Providers",
      connections: ["backend-server"],
      metrics: { filesCount: 4, linesOfCode: 680, dependencies: 6 },
    },
  ];

  const connections: ArchitectureConnection3D[] = [
    {
      id: "c1",
      fromId: "frontend",
      toId: "api-gateway",
      label: "API Requests & Chat Stream",
      type: "api_call",
      color: "#3b82f6",
    },
    {
      id: "c2",
      fromId: "api-gateway",
      toId: "auth-service",
      label: "JWT & Security Check",
      type: "data_flow",
      color: "#10b981",
    },
    {
      id: "c3",
      fromId: "auth-service",
      toId: "database",
      label: "User Query & Session Write",
      type: "db_query",
      color: "#f59e0b",
    },
    {
      id: "c4",
      fromId: "api-gateway",
      toId: "backend-server",
      label: "PTY Terminal WebSocket",
      type: "data_flow",
      color: "#8b5cf6",
    },
    {
      id: "c5",
      fromId: "backend-server",
      toId: "database",
      label: "Prisma Persistence",
      type: "db_query",
      color: "#f59e0b",
    },
    {
      id: "c6",
      fromId: "frontend",
      toId: "state-store",
      label: "Zustand State Sync",
      type: "import",
      color: "#06b6d4",
    },
    {
      id: "c7",
      fromId: "frontend",
      toId: "browser-agent",
      label: "Autonomous Web Test Run",
      type: "data_flow",
      color: "#6366f1",
    },
    {
      id: "c8",
      fromId: "api-gateway",
      toId: "ai-providers",
      label: "LLM Streaming Generation",
      type: "data_flow",
      color: "#f43f5e",
    },
  ];

  return { nodes, connections };
}
