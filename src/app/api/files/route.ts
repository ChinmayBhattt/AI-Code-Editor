import fs from "fs";
import path from "path";

const WORKSPACE_DIR = path.join(process.cwd(), "workspace");

interface FileItem {
  id: string;
  projectId: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isFolder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// GET: List all files in workspace/
export async function GET() {
  try {
    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }

    const filesList: FileItem[] = [];

    function scanDir(dir: string, relativePath = "") {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") {
          continue;
        }

        const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          filesList.push({
            id: entryPath,
            projectId: "default",
            path: entryPath,
            name: entry.name,
            content: "",
            language: "plaintext",
            isFolder: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          scanDir(fullPath, entryPath);
        } else {
          let content = "";
          try {
            const stats = fs.statSync(fullPath);
            if (stats.size < 500000) {
              content = fs.readFileSync(fullPath, "utf-8");
            }
          } catch {}

          const ext = entry.name.split(".").pop()?.toLowerCase() || "";

          filesList.push({
            id: entryPath,
            projectId: "default",
            path: entryPath,
            name: entry.name,
            content,
            language: getLanguage(ext),
            isFolder: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    scanDir(WORKSPACE_DIR);

    return new Response(JSON.stringify({ files: filesList, cwd: WORKSPACE_DIR }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// POST: Write a file to workspace/ on disk
export async function POST(req: Request) {
  try {
    const { filePath, content, action } = await req.json();

    if (!filePath) {
      return new Response(JSON.stringify({ error: "filePath is required" }), { status: 400 });
    }

    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }

    const targetPath = path.join(WORKSPACE_DIR, filePath);

    if (!targetPath.startsWith(WORKSPACE_DIR)) {
      return new Response(JSON.stringify({ error: "Invalid file path outside workspace" }), { status: 403 });
    }

    if (action === "delete") {
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
      return new Response(JSON.stringify({ success: true, action: "delete" }));
    }

    // Write file
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, content || "", "utf-8");

    return new Response(JSON.stringify({ success: true, path: filePath }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// DELETE: Clear all workspace files
export async function DELETE() {
  try {
    if (fs.existsSync(WORKSPACE_DIR)) {
      fs.rmSync(WORKSPACE_DIR, { recursive: true, force: true });
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }
    return new Response(JSON.stringify({ success: true, message: "Workspace cleared" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

function getLanguage(ext: string): string {
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    json: "json",
    html: "html",
    css: "css",
    md: "markdown",
    py: "python",
    cpp: "cpp",
    c: "c",
    java: "java",
    sql: "sql",
  };
  return map[ext] || "plaintext";
}
