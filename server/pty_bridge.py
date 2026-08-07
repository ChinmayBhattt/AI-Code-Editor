import pty, os, sys, threading, fcntl, termios, struct, select, time

workspace = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
shell_path = os.environ.get("SHELL", "/bin/zsh")

if not os.path.exists(workspace):
    os.makedirs(workspace, exist_ok=True)
try:
    os.chdir(workspace)
except Exception:
    os.chdir(os.path.expanduser("~"))

master, slave = pty.openpty()

# Set initial default size (30 rows, 140 cols)
try:
    s = struct.pack("HHHH", 30, 140, 0, 0)
    fcntl.ioctl(master, termios.TIOCSWINSZ, s)
except Exception:
    pass

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
                data = os.read(master, 4096)
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
            r, _, _ = select.select([sys.stdin], [], [], 0.05)
            if r:
                chunk = sys.stdin.buffer.read(1024)
                if not chunk:
                    time.sleep(0.05)
                    continue
                
                if b"__RESIZE__:" in chunk:
                    parts = chunk.split(b"__RESIZE__:")
                    if parts[0]:
                        os.write(master, parts[0])
                    for p in parts[1:]:
                        try:
                            lines = p.split(b"\n", 1)
                            dimensions = lines[0].decode("utf-8").split(":")
                            cols = int(dimensions[0])
                            rows = int(dimensions[1])
                            ws_struct = struct.pack("HHHH", rows, cols, 0, 0)
                            fcntl.ioctl(master, termios.TIOCSWINSZ, ws_struct)
                            if len(lines) > 1 and lines[1]:
                                os.write(master, lines[1])
                        except Exception:
                            pass
                else:
                    os.write(master, chunk)
        except Exception:
            time.sleep(0.05)
