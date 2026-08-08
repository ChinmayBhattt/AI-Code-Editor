import { ArchitectureNode3D, ArchitectureConnection3D } from "@/stores/architecture-3d-store";

// Starting state: Single square block
export function getSingleRootArchitecture(): {
  nodes: ArchitectureNode3D[];
  connections: ArchitectureConnection3D[];
} {
  return {
    nodes: [
      {
        id: "root-app",
        name: "Root Application Core",
        type: "service",
        filePath: "src/app/page.tsx",
        position: [0, 2, 0],
        size: [4, 4.5, 4],
        color: "#6366f1", // Indigo Glow
        status: "healthy",
        description: "Single Starting Root Core - Ask AI Assistant to generate full 3D System Design!",
        connections: [],
        metrics: { filesCount: 1, linesOfCode: 240, dependencies: 4 },
      },
    ],
    connections: [],
  };
}

// Generates System Design based on user prompt (e.g. "build system design of Agentic AI")
export function generateArchitectureFromPrompt(prompt: string): {
  nodes: ArchitectureNode3D[];
  connections: ArchitectureConnection3D[];
  aiMessage: string;
} {
  const p = prompt.toLowerCase();

  // 1. Agentic AI System Architecture
  if (p.includes("agent") || p.includes("ai") || p.includes("llm") || p.includes("agentic")) {
    const nodes: ArchitectureNode3D[] = [
      {
        id: "user-ingest",
        name: "User Intent Ingress",
        type: "frontend",
        filePath: "src/components/ai-chat/chat-input.tsx",
        position: [-10, 2, 0],
        size: [3.5, 4.5, 3.5],
        color: "#3b82f6",
        status: "healthy",
        description: "Multimodal Chat Input, Image Attachments, Slash Commands Ingress",
        connections: ["planner-engine"],
        metrics: { filesCount: 4, linesOfCode: 520, dependencies: 6 },
      },
      {
        id: "planner-engine",
        name: "Planner & Reasoner (LLM)",
        type: "api",
        filePath: "src/app/api/chat/route.ts",
        position: [-4, 2.8, -4],
        size: [4, 6, 4],
        color: "#8b5cf6",
        status: "healthy",
        description: "Task Decomposer, Chain-of-Thought Planner, Model Context Protocol Router",
        connections: ["tool-mesh", "agent-swarm"],
        metrics: { filesCount: 8, linesOfCode: 1100, dependencies: 9 },
      },
      {
        id: "tool-mesh",
        name: "Tool Calling Mesh (MCP)",
        type: "service",
        filePath: "src/stores/mcp-store.ts",
        position: [3, 2.2, -5],
        size: [3.5, 5, 3.5],
        color: "#ec4899",
        status: "healthy",
        description: "Model Context Protocol Server Tools, GitHub API, SQLite, Web Browser Search",
        connections: ["memory-store"],
        metrics: { filesCount: 6, linesOfCode: 780, dependencies: 8 },
      },
      {
        id: "agent-swarm",
        name: "Multi-Agent Swarm",
        type: "backend",
        filePath: "src/lib/browser/browser-agent-executor.ts",
        position: [3, 2.5, 3],
        size: [4, 5.5, 4],
        color: "#06b6d4",
        status: "healthy",
        description: "Autonomous Browser Agent, Terminal PTY Subagent, Code Fixer Subagent",
        connections: ["sandbox-executor"],
        metrics: { filesCount: 7, linesOfCode: 1250, dependencies: 10 },
      },
      {
        id: "memory-store",
        name: "Vector Memory & RAG Store",
        type: "database",
        filePath: "prisma/schema.prisma",
        position: [10, 3, -2],
        size: [4.5, 7, 4.5],
        color: "#f59e0b",
        status: "warning",
        description: "Embeddings Vector Index, Context History, Active Workspace State",
        connections: [],
        metrics: { filesCount: 5, linesOfCode: 640, dependencies: 5 },
      },
      {
        id: "sandbox-executor",
        name: "Sandbox Code Execution",
        type: "backend",
        filePath: "server/pty-server.mjs",
        position: [-3, 1.8, 5],
        size: [3.5, 4, 3.5],
        color: "#10b981",
        status: "healthy",
        description: "Node-PTY Isolated Container Execution, Shell Process Runner, Test Verifier",
        connections: ["memory-store"],
        metrics: { filesCount: 4, linesOfCode: 490, dependencies: 4 },
      },
    ];

    const connections: ArchitectureConnection3D[] = [
      { id: "ac1", fromId: "user-ingest", toId: "planner-engine", label: "User Prompt Stream", type: "data_flow", color: "#3b82f6" },
      { id: "ac2", fromId: "planner-engine", toId: "tool-mesh", label: "MCP Tool Execution", type: "api_call", color: "#8b5cf6" },
      { id: "ac3", fromId: "planner-engine", toId: "agent-swarm", label: "Subagent Delegation", type: "data_flow", color: "#8b5cf6" },
      { id: "ac4", fromId: "tool-mesh", toId: "memory-store", label: "Vector Search & Retrieval", type: "db_query", color: "#ec4899" },
      { id: "ac5", fromId: "agent-swarm", toId: "sandbox-executor", label: "PTY Command Exec", type: "data_flow", color: "#06b6d4" },
      { id: "ac6", fromId: "sandbox-executor", toId: "memory-store", label: "Persist Logs & Artifacts", type: "db_query", color: "#10b981" },
    ];

    return {
      nodes,
      connections,
      aiMessage: "🤖 Generated 3D System Design for Agentic AI Architecture!",
    };
  }

  // 2. Default Full Codebase Architecture
  return {
    ...generateDefaultArchitecture(),
    aiMessage: `🤖 Generated 3D System Design for: "${prompt}"`,
  };
}

// Standard full codebase architecture
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
      color: "#3b82f6",
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
      color: "#8b5cf6",
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
      color: "#10b981",
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
      color: "#f59e0b",
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
      color: "#ec4899",
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
      color: "#06b6d4",
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
      color: "#6366f1",
      status: "healthy",
      description: "Autonomous Web Testing Engine, DOM Inspection, Bug Auto-Fixing",
      connections: ["api-gateway"],
      metrics: { filesCount: 3, linesOfCode: 540, dependencies: 3 },
    },
  ];

  const connections: ArchitectureConnection3D[] = [
    { id: "c1", fromId: "frontend", toId: "api-gateway", label: "API Requests & Chat Stream", type: "api_call", color: "#3b82f6" },
    { id: "c2", fromId: "api-gateway", toId: "auth-service", label: "JWT & Security Check", type: "data_flow", color: "#10b981" },
    { id: "c3", fromId: "auth-service", toId: "database", label: "User Query & Session Write", type: "db_query", color: "#f59e0b" },
    { id: "c4", fromId: "api-gateway", toId: "backend-server", label: "PTY Terminal WebSocket", type: "data_flow", color: "#8b5cf6" },
    { id: "c5", fromId: "backend-server", toId: "database", label: "Prisma Persistence", type: "db_query", color: "#f59e0b" },
  ];

  return { nodes, connections };
}
