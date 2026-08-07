import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Map file extension to Monaco language identifier */
export function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    less: "less",
    md: "markdown",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    go: "go",
    rs: "rust",
    php: "php",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    dockerfile: "dockerfile",
    graphql: "graphql",
    prisma: "prisma",
    env: "dotenv",
    gitignore: "ignore",
    svg: "xml",
    vue: "vue",
    svelte: "svelte",
  };
  return map[ext] || "plaintext";
}

/** Get icon name based on file extension */
export function getFileIcon(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "file-code-2",
    tsx: "file-code-2",
    js: "file-code-2",
    jsx: "file-code-2",
    json: "file-json",
    html: "file-code",
    css: "file-code",
    md: "file-text",
    py: "file-code-2",
    java: "file-code-2",
    go: "file-code-2",
    rs: "file-code-2",
    sql: "database",
    env: "file-lock",
    gitignore: "git-branch",
    prisma: "database",
  };
  return map[ext] || "file";
}

/** Generate a unique ID */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/** Debounce utility */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/** Format date for display */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Truncate string */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}
