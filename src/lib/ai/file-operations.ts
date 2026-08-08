import type { FileOperation } from "@/types/project";

/**
 * Robust parser for AI responses to extract file operations.
 *
 * Supports formats:
 *   1. ```create:path/to/file.ext ... ```
 *   2. ```edit:path/to/file.ext ... ```
 *   3. ```html:index.html ... ```
 *   4. Standard ```python ... ``` (with filename detection from preceding text)
 */
export function parseFileOperations(response: string): FileOperation[] {
  const operations: FileOperation[] = [];
  const seenPaths = new Set<string>();

  // 1. Match explicit operation blocks: ```create:path/to/file.ext or ```edit:path/to/file.ext
  const explicitRegex = /```(create|edit|delete|rename):([^\n]+)\n([\s\S]*?)```/g;
  let match;
  while ((match = explicitRegex.exec(response)) !== null) {
    const [, type, pathSpec, rawContent] = match;
    const path = pathSpec.trim();
    let content = rawContent.trimEnd();

    // If block content is empty/whitespace, check if there's a code block following it
    if ((type === "create" || type === "edit") && !content.trim()) {
      const restOfText = response.substring(match.index + match[0].length);
      const nextCodeBlock = restOfText.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
      if (nextCodeBlock && nextCodeBlock[1]) {
        content = nextCodeBlock[1].trimEnd();
      }
    }

    if (type === "create" || type === "edit") {
      operations.push({
        type: type as "create" | "edit",
        path,
        content,
      });
      seenPaths.add(path);
    } else if (type === "delete") {
      operations.push({ type: "delete", path });
    } else if (type === "rename") {
      const [oldPath, newPath] = pathSpec.split("->");
      if (oldPath && newPath) {
        operations.push({
          type: "rename",
          path: oldPath.trim(),
          newPath: newPath.trim(),
        });
      }
    }
  }

  // 2. Match annotated code blocks: ```html:index.html or ```python:main.py
  const annotatedRegex = /```([a-zA-Z0-9_-]+):([^\n]+)\n([\s\S]*?)```/g;
  while ((match = annotatedRegex.exec(response)) !== null) {
    const [, , pathSpec, content] = match;
    const path = pathSpec.trim();

    if (!seenPaths.has(path) && path.includes(".")) {
      operations.push({
        type: "edit",
        path,
        content: content.trimEnd(),
      });
      seenPaths.add(path);
    }
  }

  // 3. Fallback: Match standard code blocks (html, css, js, py, txt, etc.)
  const codeBlockRegex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/gi;
  let blockCount = 0;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const [, langRaw = "", content] = match;
    const lang = langRaw.trim().toLowerCase();

    // Skip if this block was an explicit create/edit directive
    if (["create", "edit", "delete", "rename"].some((k) => lang.startsWith(k + ":"))) {
      continue;
    }

    // Check if filename was mentioned in text directly before this block
    const precedingText = response.substring(Math.max(0, match.index - 200), match.index);
    const filenameMention = precedingText.match(
      /(?:file|filename|edit|create|in|for|update|add to)\s+[`"']?([a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+)[`"']?/i
    );

    let targetPath = "";
    if (filenameMention && filenameMention[1]) {
      targetPath = filenameMention[1];
    } else {
      blockCount++;
      if (lang === "html") targetPath = "index.html";
      else if (lang === "css") targetPath = "styles.css";
      else if (lang === "js" || lang === "javascript") targetPath = "script.js";
      else if (lang === "ts" || lang === "typescript") targetPath = "index.ts";
      else if (lang === "jsx" || lang === "tsx") targetPath = "App.tsx";
      else if (lang === "py" || lang === "python") targetPath = "main.py";
      else if (lang === "json") targetPath = "package.json";
      else if (lang === "txt" || lang === "requirements") targetPath = "requirements.txt";
      else if (lang === "toml") targetPath = "pyproject.toml";
      else if (lang) targetPath = `file-${blockCount}.${lang}`;
    }

    if (targetPath && content.trim()) {
      const existingIdx = operations.findIndex((op) => op.path === targetPath);
      if (
        existingIdx !== -1 &&
        (!operations[existingIdx].content || operations[existingIdx].content.trim() === "")
      ) {
        operations[existingIdx].content = content.trimEnd();
      } else if (!seenPaths.has(targetPath)) {
        operations.push({
          type: "edit",
          path: targetPath,
          content: content.trimEnd(),
        });
        seenPaths.add(targetPath);
      }
    }
  }

  return operations;
}

export function extractExplanation(response: string): string {
  return response
    .replace(/```(create|edit|delete|rename):[^\n]+\n[\s\S]*?```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countOperations(operations: FileOperation[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const op of operations) {
    counts[op.type] = (counts[op.type] || 0) + 1;
  }
  return counts;
}

export function parseAutomationWorkflow(response: string): {
  name?: string;
  nodes: any[];
  edges: any[];
} | null {
  const regex = /```(?:automation:workflow|json:automation|workflow)\n([\s\S]*?)```/i;
  const match = regex.exec(response);
  if (!match || !match[1]) return null;

  try {
    const data = JSON.parse(match[1].trim());
    if (Array.isArray(data.nodes)) {
      return {
        name: data.name,
        nodes: data.nodes,
        edges: data.edges || [],
      };
    }
  } catch {}

  return null;
}
