import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

// All terminal commands run inside workspace/ — isolated from IDE source
const WORKSPACE_DIR = path.join(process.cwd(), "workspace");

export async function POST(req: Request) {
  try {
    const { command } = await req.json();

    if (!command || typeof command !== "string") {
      return new Response(JSON.stringify({ error: "No command provided" }), {
        status: 400,
      });
    }

    const trimmed = command.trim();

    if (trimmed === "clear") {
      return new Response(JSON.stringify({ output: "", type: "clear" }));
    }

    // Ensure workspace exists
    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }

    // Execute real system command inside workspace/ directory
    const { stdout, stderr } = await execAsync(trimmed, {
      cwd: WORKSPACE_DIR,
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10,
      env: {
        ...process.env,
        PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
        HOME: process.env.HOME,
      },
    });

    const output = [stdout, stderr].filter(Boolean).join("\n").trim();

    return new Response(
      JSON.stringify({
        output: output || "[Command executed successfully]",
        type: stderr ? "warn" : "log",
        cwd: WORKSPACE_DIR,
      })
    );
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string; code?: number };
    const output = [error.stdout, error.stderr, error.message]
      .filter(Boolean)
      .join("\n")
      .trim();

    return new Response(
      JSON.stringify({
        output: output || `Command failed with code ${error.code || 1}`,
        type: "error",
      })
    );
  }
}
