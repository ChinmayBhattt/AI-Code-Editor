// ─── Automation / Workflow Builder Types ─────────────────────────────────────

export type AutomationNodeType =
  | "trigger"
  | "action"
  | "condition"
  | "ai-agent"
  | "code"
  | "output"
  | "mcp";

export interface NodePort {
  id: string;
  label: string;
}

export interface AutomationNode {
  id: string;
  type: AutomationNodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: Record<string, unknown>;
  inputs: NodePort[];
  outputs: NodePort[];
}

export interface AutomationEdge {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  createdAt: string;
  updatedAt: string;
}

// ─── Node Templates (palette items) ─────────────────────────────────────────

export interface NodeTemplate {
  type: AutomationNodeType;
  label: string;
  description: string;
  icon: string; // lucide icon name
  category: string;
  defaultConfig: Record<string, unknown>;
  inputs: NodePort[];
  outputs: NodePort[];
}

export const NODE_TEMPLATES: NodeTemplate[] = [
  // ── Triggers ──
  {
    type: "trigger",
    label: "Webhook Trigger",
    description: "Starts workflow when a webhook is received",
    icon: "Webhook",
    category: "Triggers",
    defaultConfig: { method: "POST", path: "/webhook" },
    inputs: [],
    outputs: [{ id: "out", label: "Output" }],
  },
  {
    type: "trigger",
    label: "Schedule Trigger",
    description: "Runs workflow on a cron schedule",
    icon: "Clock",
    category: "Triggers",
    defaultConfig: { cron: "0 * * * *", timezone: "UTC" },
    inputs: [],
    outputs: [{ id: "out", label: "Output" }],
  },
  {
    type: "trigger",
    label: "Manual Trigger",
    description: "Manually start the workflow",
    icon: "Play",
    category: "Triggers",
    defaultConfig: {},
    inputs: [],
    outputs: [{ id: "out", label: "Output" }],
  },
  {
    type: "trigger",
    label: "File Watcher",
    description: "Triggers when files change in a directory",
    icon: "Eye",
    category: "Triggers",
    defaultConfig: { path: "./src", pattern: "**/*.ts" },
    inputs: [],
    outputs: [{ id: "out", label: "Output" }],
  },

  // ── Actions ──
  {
    type: "action",
    label: "HTTP Request",
    description: "Make an API call to any endpoint",
    icon: "Globe",
    category: "Actions",
    defaultConfig: { method: "GET", url: "", headers: {}, body: "" },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [{ id: "out", label: "Response" }],
  },
  {
    type: "action",
    label: "Send Email",
    description: "Send an email notification",
    icon: "Mail",
    category: "Actions",
    defaultConfig: { to: "", subject: "", body: "" },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [{ id: "out", label: "Sent" }],
  },
  {
    type: "action",
    label: "Read/Write File",
    description: "Read or write files in the workspace",
    icon: "FileText",
    category: "Actions",
    defaultConfig: { operation: "read", path: "", content: "" },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [{ id: "out", label: "Output" }],
  },
  {
    type: "action",
    label: "Database Query",
    description: "Execute a SQL or NoSQL query",
    icon: "Database",
    category: "Actions",
    defaultConfig: { type: "sql", query: "", connection: "" },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [{ id: "out", label: "Results" }],
  },
  {
    type: "action",
    label: "Slack Message",
    description: "Send a message to a Slack channel",
    icon: "MessageSquare",
    category: "Actions",
    defaultConfig: { channel: "", message: "" },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [{ id: "out", label: "Sent" }],
  },

  // ── Conditions ──
  {
    type: "condition",
    label: "If / Else",
    description: "Branch workflow based on a condition",
    icon: "GitBranch",
    category: "Logic",
    defaultConfig: { field: "", operator: "equals", value: "" },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
  },
  {
    type: "condition",
    label: "Switch",
    description: "Route to different outputs based on value",
    icon: "ToggleLeft",
    category: "Logic",
    defaultConfig: { field: "", cases: [] },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [
      { id: "case1", label: "Case 1" },
      { id: "case2", label: "Case 2" },
      { id: "default", label: "Default" },
    ],
  },

  // ── AI Agent ──
  {
    type: "ai-agent",
    label: "AI Text Generator",
    description: "Generate text using an AI model",
    icon: "Sparkles",
    category: "AI",
    defaultConfig: {
      model: "gemini-2.0-flash",
      systemPrompt: "You are a helpful assistant.",
      temperature: 0.7,
      maxTokens: 2048,
    },
    inputs: [{ id: "in", label: "Prompt" }],
    outputs: [{ id: "out", label: "Response" }],
  },
  {
    type: "ai-agent",
    label: "AI Code Reviewer",
    description: "Review code using AI and provide feedback",
    icon: "Bot",
    category: "AI",
    defaultConfig: {
      model: "gemini-2.0-flash",
      systemPrompt: "You are a senior code reviewer. Review the code for bugs, performance, and best practices.",
      temperature: 0.3,
    },
    inputs: [{ id: "in", label: "Code" }],
    outputs: [{ id: "out", label: "Review" }],
  },
  {
    type: "ai-agent",
    label: "AI Summarizer",
    description: "Summarize text or documents using AI",
    icon: "FileSearch",
    category: "AI",
    defaultConfig: {
      model: "gemini-2.0-flash",
      systemPrompt: "Summarize the following content concisely.",
      temperature: 0.5,
    },
    inputs: [{ id: "in", label: "Text" }],
    outputs: [{ id: "out", label: "Summary" }],
  },

  // ── Code ──
  {
    type: "code",
    label: "JavaScript",
    description: "Execute custom JavaScript code",
    icon: "Code",
    category: "Code",
    defaultConfig: {
      language: "javascript",
      code: '// Access input data via `input`\nconst result = input;\nreturn result;',
    },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [{ id: "out", label: "Output" }],
  },
  {
    type: "code",
    label: "Python Script",
    description: "Execute a Python script",
    icon: "Terminal",
    category: "Code",
    defaultConfig: {
      language: "python",
      code: '# Access input data via `input_data`\nresult = input_data\nprint(result)',
    },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [{ id: "out", label: "Output" }],
  },
  {
    type: "code",
    label: "Data Transform",
    description: "Transform data using JavaScript expressions",
    icon: "Shuffle",
    category: "Code",
    defaultConfig: {
      language: "javascript",
      code: '// Transform input data\nreturn { ...input, transformed: true };',
    },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [{ id: "out", label: "Output" }],
  },

  // ── Output ──
  {
    type: "output",
    label: "Console Output",
    description: "Log output to the console panel",
    icon: "Monitor",
    category: "Output",
    defaultConfig: { format: "json" },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [],
  },
  {
    type: "output",
    label: "Save to File",
    description: "Save workflow output to a file",
    icon: "Save",
    category: "Output",
    defaultConfig: { path: "output.json", format: "json" },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [],
  },
  // ── MCP Protocol ──
  {
    type: "mcp",
    label: "MCP Tool Call",
    description: "Execute tool on an MCP (Model Context Protocol) server",
    icon: "Cpu",
    category: "MCP",
    defaultConfig: {
      serverId: "mcp-github",
      toolName: "create_issue",
      args: { title: "Bug report from automation", owner: "user", repo: "app" },
    },
    inputs: [{ id: "in", label: "Input" }],
    outputs: [{ id: "out", label: "Result" }],
  },
];

// ─── Node Type Visual Config ─────────────────────────────────────────────────

export const NODE_TYPE_COLORS: Record<
  AutomationNodeType,
  { bg: string; border: string; text: string; glow: string; icon: string }
> = {
  trigger: {
    bg: "bg-amber-950/60",
    border: "border-amber-500/40",
    text: "text-amber-300",
    glow: "shadow-amber-500/20",
    icon: "text-amber-400",
  },
  action: {
    bg: "bg-blue-950/60",
    border: "border-blue-500/40",
    text: "text-blue-300",
    glow: "shadow-blue-500/20",
    icon: "text-blue-400",
  },
  condition: {
    bg: "bg-purple-950/60",
    border: "border-purple-500/40",
    text: "text-purple-300",
    glow: "shadow-purple-500/20",
    icon: "text-purple-400",
  },
  "ai-agent": {
    bg: "bg-indigo-950/60",
    border: "border-indigo-500/40",
    text: "text-indigo-300",
    glow: "shadow-indigo-500/20",
    icon: "text-indigo-400",
  },
  code: {
    bg: "bg-emerald-950/60",
    border: "border-emerald-500/40",
    text: "text-emerald-300",
    glow: "shadow-emerald-500/20",
    icon: "text-emerald-400",
  },
  output: {
    bg: "bg-rose-950/60",
    border: "border-rose-500/40",
    text: "text-rose-300",
    glow: "shadow-rose-500/20",
    icon: "text-rose-400",
  },
  mcp: {
    bg: "bg-cyan-950/60",
    border: "border-cyan-500/40",
    text: "text-cyan-300",
    glow: "shadow-cyan-500/20",
    icon: "text-cyan-400",
  },
};
