"use client";

import { useRef, useState } from "react";
import { useAutomationStore } from "@/stores/automation-store";
import type { AutomationNode } from "@/types/automation";
import { NODE_TYPE_COLORS } from "@/types/automation";
import {
  Webhook,
  Clock,
  Play,
  Eye,
  Globe,
  Mail,
  FileText,
  Database,
  MessageSquare,
  GitBranch,
  ToggleLeft,
  Sparkles,
  Bot,
  FileSearch,
  Code,
  Terminal,
  Shuffle,
  Monitor,
  Save,
  Trash2,
  GripVertical,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Webhook, Clock, Play, Eye, Globe, Mail, FileText, Database,
  MessageSquare, GitBranch, ToggleLeft, Sparkles, Bot, FileSearch,
  Code, Terminal, Shuffle, Monitor, Save,
};

function getIconForLabel(label: string): React.ComponentType<{ className?: string }> {
  // Try to match label to an icon
  if (label.includes("Webhook")) return Webhook;
  if (label.includes("Schedule")) return Clock;
  if (label.includes("Manual")) return Play;
  if (label.includes("File Watcher")) return Eye;
  if (label.includes("HTTP")) return Globe;
  if (label.includes("Email")) return Mail;
  if (label.includes("File")) return FileText;
  if (label.includes("Database")) return Database;
  if (label.includes("Slack")) return MessageSquare;
  if (label.includes("If") || label.includes("Else")) return GitBranch;
  if (label.includes("Switch")) return ToggleLeft;
  if (label.includes("Text Generator") || label.includes("Summarizer")) return Sparkles;
  if (label.includes("Code Reviewer")) return Bot;
  if (label.includes("JavaScript") || label.includes("Transform")) return Code;
  if (label.includes("Python")) return Terminal;
  if (label.includes("Console")) return Monitor;
  if (label.includes("Save")) return Save;
  return Sparkles;
}

interface WorkflowNodeProps {
  node: AutomationNode;
  isSelected: boolean;
  zoom: number;
  onStartConnect: (nodeId: string, portId: string, isOutput: boolean) => void;
  onEndConnect: (nodeId: string, portId: string) => void;
}

export function WorkflowNode({
  node,
  isSelected,
  zoom,
  onStartConnect,
  onEndConnect,
}: WorkflowNodeProps) {
  const { selectNode, removeNode, moveNode } = useAutomationStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
  const colors = NODE_TYPE_COLORS[node.type];
  const Icon = getIconForLabel(node.label);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".port-target")) return;
    e.stopPropagation();
    selectNode(node.id);

    dragRef.current = {
      startX: e.clientX / zoom,
      startY: e.clientY / zoom,
      nodeX: node.x,
      nodeY: node.y,
    };
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = moveEvent.clientX / zoom - dragRef.current.startX;
      const dy = moveEvent.clientY / zoom - dragRef.current.startY;
      moveNode(node.id, dragRef.current.nodeX + dx, dragRef.current.nodeY + dy);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute rounded-xl border-[1.5px] transition-shadow duration-150 select-none group ${colors.bg} ${colors.border} ${
        isSelected
          ? `ring-2 ring-amber-400/40 shadow-lg ${colors.glow}`
          : "shadow-md hover:shadow-lg"
      } ${isDragging ? "cursor-grabbing z-50" : "cursor-grab"}`}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        minHeight: `${node.height}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 ${colors.icon}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-semibold truncate ${colors.text}`}>
            {node.label}
          </p>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">
            {node.type}
          </p>
        </div>
        {/* Delete on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeNode(node.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-zinc-600 hover:text-rose-400 transition-all"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Ports */}
      <div className="flex justify-between px-2 py-2 gap-2">
        {/* Input ports (left) */}
        <div className="flex flex-col gap-2">
          {node.inputs.map((port) => (
            <div
              key={port.id}
              data-port-id={port.id}
              data-node-id={node.id}
              data-port-type="input"
              className="port-target group/port flex items-center gap-1.5 cursor-pointer relative py-1 px-1 rounded hover:bg-white/10 transition-colors"
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartConnect(node.id, port.id, false);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEndConnect(node.id, port.id);
              }}
            >
              <div
                className="port-circle w-3.5 h-3.5 rounded-full border-2 border-zinc-400 bg-zinc-900 group-hover/port:border-amber-400 group-hover/port:bg-amber-400/40 transition-all shrink-0 -ml-[11px]"
              />
              <span className="text-[10px] text-zinc-400 group-hover/port:text-amber-300 font-medium select-none pointer-events-none">
                {port.label}
              </span>
            </div>
          ))}
        </div>

        {/* Output ports (right) */}
        <div className="flex flex-col gap-2 items-end">
          {node.outputs.map((port) => (
            <div
              key={port.id}
              data-port-id={port.id}
              data-node-id={node.id}
              data-port-type="output"
              className="port-target group/port flex items-center gap-1.5 cursor-pointer relative py-1 px-1 rounded hover:bg-white/10 transition-colors"
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartConnect(node.id, port.id, true);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onStartConnect(node.id, port.id, true);
              }}
            >
              <span className="text-[10px] text-zinc-400 group-hover/port:text-amber-300 font-medium select-none pointer-events-none">
                {port.label}
              </span>
              <div
                className="port-circle w-3.5 h-3.5 rounded-full border-2 border-zinc-400 bg-zinc-900 group-hover/port:border-amber-400 group-hover/port:bg-amber-400/40 transition-all shrink-0 -mr-[11px]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
