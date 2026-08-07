// ─── AI / Chat Types ─────────────────────────────────────────────────────────

export type AIProvider = "groq" | "google";
export type AIMode = "plan" | "build";

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  maxTokens: number;
  description: string;
}

export const AI_MODELS: AIModel[] = [
  // Groq Models
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    maxTokens: 32768,
    description: "Best for complex code generation and reasoning",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    provider: "groq",
    maxTokens: 8192,
    description: "Fast responses for simple tasks",
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    provider: "groq",
    maxTokens: 32768,
    description: "Good balance of speed and quality",
  },
  // Google Gemini Models
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    maxTokens: 8192,
    description: "Fast and efficient for most tasks",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    maxTokens: 8192,
    description: "Most capable model for complex reasoning",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    maxTokens: 8192,
    description: "Balanced speed and capability",
  },
];

export interface AIConfig {
  provider: AIProvider;
  modelId: string;
  mode: AIMode;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: "groq",
  modelId: "llama-3.3-70b-versatile",
  mode: "plan",
  temperature: 0.7,
  maxTokens: 4096,
  streaming: true,
};

// ─── Settings Types ──────────────────────────────────────────────────────────

export interface AppSettings {
  theme: "dark" | "light" | "system";
  autoSave: boolean;
  autoSaveDelay: number;
  showStatusBar: boolean;
  showMinimap: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "dark",
  autoSave: true,
  autoSaveDelay: 1000,
  showStatusBar: true,
  showMinimap: true,
};

export interface APIKeys {
  groq: string;
  google: string;
}
