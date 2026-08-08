"use client";

import { useState, useEffect } from "react";
import { useAutomationStore } from "@/stores/automation-store";
import { NODE_TYPE_COLORS } from "@/types/automation";
import type { AutomationNode } from "@/types/automation";
import {
  X,
  Save,
  Trash2,
  RotateCcw,
  Settings2,
  Zap,
} from "lucide-react";

export function NodeConfigPanel() {
  const {
    getActiveWorkflow,
    selectedNodeId,
    selectNode,
    updateNode,
    removeNode,
  } = useAutomationStore();

  const workflow = getActiveWorkflow();
  const node = workflow?.nodes.find((n) => n.id === selectedNodeId);

  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>({});
  const [localLabel, setLocalLabel] = useState("");

  useEffect(() => {
    if (node) {
      setLocalConfig({ ...node.config });
      setLocalLabel(node.label);
    }
  }, [node?.id]);

  if (!node) return null;

  const colors = NODE_TYPE_COLORS[node.type];

  const handleSave = () => {
    updateNode(node.id, {
      label: localLabel,
      config: { ...localConfig },
    });
  };

  const handleReset = () => {
    setLocalConfig({ ...node.config });
    setLocalLabel(node.label);
  };

  const handleDelete = () => {
    removeNode(node.id);
    selectNode(null);
  };

  const updateConfigField = (key: string, value: unknown) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Render config fields based on node type
  const renderConfigFields = () => {
    switch (node.type) {
      case "trigger":
        return (
          <>
            {localConfig.method !== undefined && (
              <FieldGroup label="Method">
                <select
                  value={(localConfig.method as string) || "POST"}
                  onChange={(e) => updateConfigField("method", e.target.value)}
                  className="field-input"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
              </FieldGroup>
            )}
            {localConfig.path !== undefined && (
              <FieldGroup label="Endpoint Path">
                <input
                  value={(localConfig.path as string) || ""}
                  onChange={(e) => updateConfigField("path", e.target.value)}
                  placeholder="/webhook"
                  className="field-input"
                />
              </FieldGroup>
            )}
            {localConfig.cron !== undefined && (
              <FieldGroup label="Cron Expression">
                <input
                  value={(localConfig.cron as string) || ""}
                  onChange={(e) => updateConfigField("cron", e.target.value)}
                  placeholder="0 * * * *"
                  className="field-input"
                />
              </FieldGroup>
            )}
            {localConfig.timezone !== undefined && (
              <FieldGroup label="Timezone">
                <input
                  value={(localConfig.timezone as string) || ""}
                  onChange={(e) => updateConfigField("timezone", e.target.value)}
                  placeholder="UTC"
                  className="field-input"
                />
              </FieldGroup>
            )}
            {localConfig.pattern !== undefined && (
              <FieldGroup label="File Pattern">
                <input
                  value={(localConfig.pattern as string) || ""}
                  onChange={(e) => updateConfigField("pattern", e.target.value)}
                  placeholder="**/*.ts"
                  className="field-input"
                />
              </FieldGroup>
            )}
          </>
        );

      case "action":
        return (
          <>
            {localConfig.method !== undefined && (
              <FieldGroup label="HTTP Method">
                <select
                  value={(localConfig.method as string) || "GET"}
                  onChange={(e) => updateConfigField("method", e.target.value)}
                  className="field-input"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </FieldGroup>
            )}
            {localConfig.url !== undefined && (
              <FieldGroup label="URL">
                <input
                  value={(localConfig.url as string) || ""}
                  onChange={(e) => updateConfigField("url", e.target.value)}
                  placeholder="https://api.example.com/data"
                  className="field-input"
                />
              </FieldGroup>
            )}
            {localConfig.to !== undefined && (
              <FieldGroup label="To">
                <input
                  value={(localConfig.to as string) || ""}
                  onChange={(e) => updateConfigField("to", e.target.value)}
                  placeholder="email@example.com"
                  className="field-input"
                />
              </FieldGroup>
            )}
            {localConfig.subject !== undefined && (
              <FieldGroup label="Subject">
                <input
                  value={(localConfig.subject as string) || ""}
                  onChange={(e) => updateConfigField("subject", e.target.value)}
                  placeholder="Email Subject"
                  className="field-input"
                />
              </FieldGroup>
            )}
            {localConfig.body !== undefined && typeof localConfig.body === "string" && (
              <FieldGroup label="Body">
                <textarea
                  value={(localConfig.body as string) || ""}
                  onChange={(e) => updateConfigField("body", e.target.value)}
                  placeholder="Content body..."
                  className="field-input field-textarea"
                  rows={4}
                />
              </FieldGroup>
            )}
            {localConfig.operation !== undefined && (
              <FieldGroup label="Operation">
                <select
                  value={(localConfig.operation as string) || "read"}
                  onChange={(e) => updateConfigField("operation", e.target.value)}
                  className="field-input"
                >
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="append">Append</option>
                </select>
              </FieldGroup>
            )}
            {localConfig.query !== undefined && (
              <FieldGroup label="Query">
                <textarea
                  value={(localConfig.query as string) || ""}
                  onChange={(e) => updateConfigField("query", e.target.value)}
                  placeholder="SELECT * FROM users"
                  className="field-input field-textarea font-mono"
                  rows={3}
                />
              </FieldGroup>
            )}
            {localConfig.channel !== undefined && (
              <FieldGroup label="Channel">
                <input
                  value={(localConfig.channel as string) || ""}
                  onChange={(e) => updateConfigField("channel", e.target.value)}
                  placeholder="#general"
                  className="field-input"
                />
              </FieldGroup>
            )}
            {localConfig.message !== undefined && (
              <FieldGroup label="Message">
                <textarea
                  value={(localConfig.message as string) || ""}
                  onChange={(e) => updateConfigField("message", e.target.value)}
                  placeholder="Hello from automation!"
                  className="field-input field-textarea"
                  rows={3}
                />
              </FieldGroup>
            )}
            {localConfig.connection !== undefined && (
              <FieldGroup label="Connection String">
                <input
                  value={(localConfig.connection as string) || ""}
                  onChange={(e) => updateConfigField("connection", e.target.value)}
                  placeholder="mysql://user:pass@host:3306/db"
                  className="field-input"
                />
              </FieldGroup>
            )}
          </>
        );

      case "condition":
        return (
          <>
            <FieldGroup label="Field">
              <input
                value={(localConfig.field as string) || ""}
                onChange={(e) => updateConfigField("field", e.target.value)}
                placeholder="data.status"
                className="field-input"
              />
            </FieldGroup>
            {localConfig.operator !== undefined && (
              <FieldGroup label="Operator">
                <select
                  value={(localConfig.operator as string) || "equals"}
                  onChange={(e) => updateConfigField("operator", e.target.value)}
                  className="field-input"
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                  <option value="is_empty">Is Empty</option>
                  <option value="is_not_empty">Is Not Empty</option>
                </select>
              </FieldGroup>
            )}
            {localConfig.value !== undefined && (
              <FieldGroup label="Value">
                <input
                  value={(localConfig.value as string) || ""}
                  onChange={(e) => updateConfigField("value", e.target.value)}
                  placeholder="success"
                  className="field-input"
                />
              </FieldGroup>
            )}
          </>
        );

      case "ai-agent":
        return (
          <>
            <FieldGroup label="Model">
              <select
                value={(localConfig.model as string) || "gemini-2.0-flash"}
                onChange={(e) => updateConfigField("model", e.target.value)}
                className="field-input"
              >
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              </select>
            </FieldGroup>
            <FieldGroup label="System Prompt">
              <textarea
                value={(localConfig.systemPrompt as string) || ""}
                onChange={(e) => updateConfigField("systemPrompt", e.target.value)}
                placeholder="You are a helpful assistant."
                className="field-input field-textarea"
                rows={4}
              />
            </FieldGroup>
            <FieldGroup label={`Temperature: ${localConfig.temperature ?? 0.7}`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={(localConfig.temperature as number) ?? 0.7}
                onChange={(e) =>
                  updateConfigField("temperature", parseFloat(e.target.value))
                }
                className="w-full accent-indigo-500 h-1.5"
              />
            </FieldGroup>
            {localConfig.maxTokens !== undefined && (
              <FieldGroup label="Max Tokens">
                <input
                  type="number"
                  value={(localConfig.maxTokens as number) || 2048}
                  onChange={(e) =>
                    updateConfigField("maxTokens", parseInt(e.target.value))
                  }
                  className="field-input"
                />
              </FieldGroup>
            )}
          </>
        );

      case "code":
        return (
          <>
            <FieldGroup label="Language">
              <select
                value={(localConfig.language as string) || "javascript"}
                onChange={(e) => updateConfigField("language", e.target.value)}
                className="field-input"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Code">
              <textarea
                value={(localConfig.code as string) || ""}
                onChange={(e) => updateConfigField("code", e.target.value)}
                className="field-input field-textarea font-mono text-emerald-300"
                rows={8}
                spellCheck={false}
              />
            </FieldGroup>
          </>
        );

      case "output":
        return (
          <>
            <FieldGroup label="Format">
              <select
                value={(localConfig.format as string) || "json"}
                onChange={(e) => updateConfigField("format", e.target.value)}
                className="field-input"
              >
                <option value="json">JSON</option>
                <option value="text">Plain Text</option>
                <option value="csv">CSV</option>
              </select>
            </FieldGroup>
            {localConfig.path !== undefined && (
              <FieldGroup label="Output File Path">
                <input
                  value={(localConfig.path as string) || ""}
                  onChange={(e) => updateConfigField("path", e.target.value)}
                  placeholder="output.json"
                  className="field-input"
                />
              </FieldGroup>
            )}
          </>
        );

      case "mcp":
        return (
          <>
            <FieldGroup label="Target MCP Server">
              <select
                value={(localConfig.serverId as string) || "mcp-github"}
                onChange={(e) => updateConfigField("serverId", e.target.value)}
                className="field-input"
              >
                <option value="mcp-github">GitHub MCP Server</option>
                <option value="mcp-sqlite">SQLite Database MCP</option>
                <option value="mcp-brave-search">Brave Web Search MCP</option>
                <option value="mcp-filesystem">Filesystem MCP Server</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Tool Name">
              <input
                value={(localConfig.toolName as string) || "create_issue"}
                onChange={(e) => updateConfigField("toolName", e.target.value)}
                placeholder="e.g. create_issue, sqlite_query"
                className="field-input font-mono text-cyan-300"
              />
            </FieldGroup>
            <FieldGroup label="Tool Arguments (JSON)">
              <textarea
                value={
                  typeof localConfig.args === "object"
                    ? JSON.stringify(localConfig.args, null, 2)
                    : (localConfig.args as string) || "{}"
                }
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    updateConfigField("args", parsed);
                  } catch {
                    updateConfigField("args", e.target.value);
                  }
                }}
                placeholder='{ "owner": "user", "repo": "app" }'
                className="field-input field-textarea font-mono text-cyan-200"
                rows={5}
                spellCheck={false}
              />
            </FieldGroup>
          </>
        );

      default:
        return (
          <div className="text-xs text-zinc-500 italic p-2">
            No configuration available for this node type.
          </div>
        );
    }
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#111114] border-l border-zinc-800/80 z-40 flex flex-col shadow-2xl">
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/80 ${colors.bg}`}>
        <div className="flex items-center gap-2">
          <Settings2 className={`h-3.5 w-3.5 ${colors.icon}`} />
          <span className="text-xs font-semibold text-zinc-200">Configure Node</span>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Node info bar */}
      <div className={`px-3 py-2 border-b border-zinc-800/50 ${colors.bg}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 ${colors.icon}`}>
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className={`text-[11px] font-semibold ${colors.text}`}>{node.label}</p>
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider">
              {node.type} · {node.inputs.length} in · {node.outputs.length} out
            </p>
          </div>
        </div>
      </div>

      {/* Config fields */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* Label field (common to all) */}
        <FieldGroup label="Node Label">
          <input
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            className="field-input"
          />
        </FieldGroup>

        <div className="border-t border-zinc-800/60 pt-3" />

        {renderConfigFields()}
      </div>

      {/* Action buttons */}
      <div className="px-3 py-2.5 border-t border-zinc-800/80 flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
        >
          <Save className="h-3 w-3" />
          Save
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
          title="Delete Node"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// Reusable field group component
function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
