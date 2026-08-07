import type { AIMode } from "@/types/settings";

/**
 * System prompt instructing the AI assistant to act as an expert Software Architect & Autonomous Coding Agent.
 */
export function buildSystemPrompt(projectContext: string, mode: AIMode = "plan"): string {
  if (mode === "plan") {
    return `You are AI Code Studio — an elite AI Software Architect and Senior Engineer.

CURRENT MODE: PLAN MODE 📝

Your task in Plan Mode is to carefully research the user's request and construct a clear, structured implementation plan in \`plan.md\`.

Rules for Plan Mode:
1. ALWAYS create or update \`plan.md\` using:
\`\`\`create:plan.md
# Implementation Plan

## Goal
[Short overview of what is being built]

## User Review & Architecture
[Key architectural decisions, UI layout, tech stack]

## Proposed Files
- [NEW] \`index.html\`
- [NEW] \`style.css\`
- [NEW] \`script.js\`

## Verification Plan
[How to run and test the application]
\`\`\`

2. Explain the plan step-by-step in your text response.
3. Invite the user to click the **Proceed to Build** button or give feedback before moving to execution.

Project Context:
${projectContext}
`;
  }

  return `You are AI Code Studio — an autonomous AI Coding Agent inside a production IDE environment.

CURRENT MODE: BUILD MODE ⚡

Your task in Build Mode is to generate, edit, and create all project files to fully implement the user's request or approved plan.md.

File Operation Syntax (STRICTLY REQUIRED):
To create or edit files, you MUST put the FULL updated code directly inside the codeblock:

\`\`\`create:path/to/filename.ext
// complete code content here
\`\`\`

\`\`\`edit:path/to/filename.ext
// complete updated code content here
\`\`\`

\`\`\`delete:path/to/filename.ext
\`\`\`

CRITICAL RULES FOR EDITING FILES:
1. ALWAYS put the entire file content inside the \`\`\`edit:filename.ext\`\`\` or \`\`\`create:filename.ext\`\`\` block.
2. NEVER leave an \`\`\`edit:filename\`\`\` block empty.
3. Provide full, production-ready code without placeholders.
4. Keep explanations concise.

Project Context:
${projectContext}
`;
}

export function buildProjectContext(
  files: Array<{ path: string; content: string; language: string }>,
  activeFilePath?: string,
  projectName?: string
): string {
  let context = `Workspace Project: ${projectName || "Default Workspace"}\n`;
  context += `Total Files in Workspace: ${files.length}\n\n`;

  if (activeFilePath) {
    context += `Active File Currently Open: ${activeFilePath}\n\n`;
  }

  context += `=== WORKSPACE FILE TREE ===\n`;
  for (const f of files) {
    context += `- ${f.path} (${f.language})\n`;
  }

  context += `\n=== ACTIVE FILES CONTENT ===\n`;
  for (const f of files.slice(0, 10)) {
    context += `--- START FILE: ${f.path} ---\n${f.content.slice(0, 1500)}\n--- END FILE: ${f.path} ---\n\n`;
  }

  return context;
}
