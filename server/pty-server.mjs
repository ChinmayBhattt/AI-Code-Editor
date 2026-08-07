/**
 * Real PTY Terminal WebSocket Server
 * Uses macOS native Python pty bridge to create authentic TTY devices.
 * Streams real-time keystrokes, ANSI colors, tab completion, and line editing over WebSockets to xterm.js.
 */

import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_DIR = path.join(__dirname, "..", "workspace");

// Ensure workspace directory exists
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

const PORT = 3002;
let wss;

try {
  wss = new WebSocketServer({ port: PORT });
} catch (e) {
  console.error(`Port ${PORT} in use or error:`, e.message);
  process.exit(1);
}

const terminals = new Map();
let nextTerminalId = 1;

console.log(`\x1b[36m✓ Real System PTY Terminal Server active on ws://localhost:${PORT}\x1b[0m`);
console.log(`  Workspace Directory: ${WORKSPACE_DIR}`);

// Python script to create a real PTY master/slave pair for zsh
const PYTHON_PTY_SCRIPT = `
import pty, os, sys, threading

workspace = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
shell_path = os.environ.get("SHELL", "/bin/zsh")

if not os.path.exists(workspace):
    os.makedirs(workspace, exist_ok=True)
try:
    os.chdir(workspace)
except Exception:
    os.chdir(os.path.expanduser("~"))

master, slave = pty.openpty()
pid = os.fork()

if pid == 0:
    os.close(master)
    os.setsid()
    os.dup2(slave, 0)
    os.dup2(slave, 1)
    os.dup2(slave, 2)
    if slave > 2:
        os.close(slave)
    os.environ["TERM"] = "xterm-256color"
    os.environ["COLORTERM"] = "truecolor"
    os.execv(shell_path, [shell_path, "-l"])
else:
    os.close(slave)
    
    def read_master():
        while True:
            try:
                data = os.read(master, 2048)
                if not data:
                    break
                sys.stdout.buffer.write(data)
                sys.stdout.buffer.flush()
            except Exception:
                break
                
    t = threading.Thread(target=read_master, daemon=True)
    t.start()
    
    while True:
        try:
            data = sys.stdin.buffer.read(1)
            if not data:
                break
            os.write(master, data)
        except Exception:
            break
`;

wss.on("connection", (ws) => {
  const termId = nextTerminalId++;

  let child;
  try {
    child = spawn("python3", ["-c", PYTHON_PTY_SCRIPT, WORKSPACE_DIR], {
      cwd: WORKSPACE_DIR,
      env: {
        ...process.env,
        SHELL: process.env.SHELL || "/bin/zsh",
        TERM: "xterm-256color",
        COLORTERM: "truecolor",
        LANG: "en_US.UTF-8",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    console.error(`[Terminal ${termId}] Spawn error:`, err.message);
    ws.send(JSON.stringify({ type: "output", data: `\r\n\x1b[31mFailed to start shell: ${err.message}\x1b[0m\r\n` }));
    ws.close();
    return;
  }

  terminals.set(termId, { child, ws });
  console.log(`[Terminal ${termId}] Active PTY session (PID: ${child.pid})`);

  // Forward PTY output to xterm.js
  child.stdout.on("data", (chunk) => {
    try {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "output", data: chunk.toString("utf-8") }));
      }
    } catch (e) {}
  });

  child.stderr.on("data", (chunk) => {
    try {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "output", data: chunk.toString("utf-8") }));
      }
    } catch (e) {}
  });

  child.on("exit", (code) => {
    console.log(`[Terminal ${termId}] Process exited (code: ${code})`);
    try {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "exit", exitCode: code }));
      }
    } catch (e) {}
    terminals.delete(termId);
  });

  ws.on("message", (rawMsg) => {
    try {
      const msg = JSON.parse(rawMsg.toString());
      if (msg.type === "input" && child.stdin && !child.stdin.destroyed) {
        child.stdin.write(msg.data);
      }
    } catch (e) {
      if (child.stdin && !child.stdin.destroyed) {
        child.stdin.write(rawMsg.toString());
      }
    }
  });

  ws.on("close", () => {
    try {
      child.kill();
    } catch (e) {}
    terminals.delete(termId);
  });

  ws.send(JSON.stringify({ type: "ready", termId, cwd: WORKSPACE_DIR }));
});

// Shutdown handlers
process.on("SIGINT", () => {
  for (const [, { child }] of terminals) {
    try { child.kill(); } catch (e) {}
  }
  terminals.clear();
  wss.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  for (const [, { child }] of terminals) {
    try { child.kill(); } catch (e) {}
  }
  terminals.clear();
  wss.close();
  process.exit(0);
});
