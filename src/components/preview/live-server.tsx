"use client";

import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useState, useMemo } from "react";
import {
  Globe,
  RotateCw,
  ExternalLink,
  X,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LiveServerPreview() {
  const { files, projectName } = useProjectStore();
  const { liveServerOpen, setLiveServerOpen } = useSettingsStore();

  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  // Generate complete HTML bundle from project files
  const htmlContent = useMemo(() => {
    const htmlFile = files.find((f) => f.path.endsWith(".html") || f.path === "index.html");
    const cssFiles = files.filter((f) => f.path.endsWith(".css"));
    const jsFiles = files.filter((f) => f.path.endsWith(".js") || f.path.endsWith(".ts"));

    if (htmlFile) {
      let html = htmlFile.content;

      // Inject inline CSS
      const cssStyles = cssFiles.map((c) => `<style>${c.content}</style>`).join("\n");
      if (cssStyles) {
        html = html.replace("</head>", `${cssStyles}\n</head>`);
      }

      // Inject inline JS
      const jsScripts = jsFiles
        .map((j) => `<script>(function(){ ${j.content} })();</script>`)
        .join("\n");
      if (jsScripts) {
        html = html.replace("</body>", `${jsScripts}\n</body>`);
      }

      return html;
    }

    // Default HTML if no index.html exists
    const defaultCSS = cssFiles.map((c) => c.content).join("\n");
    const defaultJS = jsFiles.map((j) => j.content).join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName || "Live Server Preview"}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 2rem;
      max-width: 450px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    h1 { margin-top: 0; color: #38bdf8; font-size: 1.5rem; }
    p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; }
    .badge {
      background: #0284c7;
      color: #ffffff;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 1rem;
    }
    ${defaultCSS}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">LIVE SERVER RUNNING</div>
    <h1>${projectName || "AI Web Application"}</h1>
    <p>Live Web Preview is active. Edit your HTML, CSS, or JS files to see instant changes.</p>
  </div>
  <script>
    try {
      ${defaultJS}
    } catch(err) {
      console.error(err);
    }
  </script>
</body>
</html>`;
  }, [files, projectName, reloadKey]);

  if (!liveServerOpen) return null;

  const handleOpenNewTab = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#111113] border-l border-zinc-800 text-zinc-300">
      {/* Address / Control Bar */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-800 bg-[#18181b] px-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Server</span>
          </div>

          <button
            onClick={() => setReloadKey((k) => k + 1)}
            title="Reload Preview"
            className="rounded p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* URL Bar */}
        <div className="flex flex-1 items-center gap-2 max-w-xs bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 text-xs text-zinc-400">
          <Globe className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span className="truncate flex-1 font-mono text-[11px]">http://localhost:3000/live</span>
        </div>

        {/* Responsive Viewport Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
          <button
            onClick={() => setDevice("desktop")}
            title="Desktop View"
            className={`p-1 rounded ${
              device === "desktop" ? "bg-zinc-800 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDevice("tablet")}
            title="Tablet View"
            className={`p-1 rounded ${
              device === "tablet" ? "bg-zinc-800 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Tablet className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            title="Mobile View"
            className={`p-1 rounded ${
              device === "mobile" ? "bg-zinc-800 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenNewTab}
            title="Open in New Tab"
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setLiveServerOpen(false)}
            title="Close Preview"
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Preview Container */}
      <div className="flex flex-1 items-center justify-center bg-[#09090b] p-4 overflow-hidden">
        <div
          className={`h-full bg-white rounded-lg shadow-2xl transition-all overflow-hidden border border-zinc-800 ${
            device === "desktop"
              ? "w-full"
              : device === "tablet"
              ? "w-[768px] max-w-full"
              : "w-[375px] max-w-full"
          }`}
        >
          <iframe
            key={reloadKey}
            srcDoc={htmlContent}
            title="Live Preview"
            className="h-full w-full border-none bg-white"
            sandbox="allow-scripts allow-modals allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
