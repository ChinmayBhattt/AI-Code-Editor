"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useAutomationStore } from "@/stores/automation-store";
import { WorkflowNode } from "./workflow-node";
import { WorkflowEdge, getPortPosition, makeBezierPath } from "./workflow-edge";
import { NodePalette } from "./node-palette";
import { NodeConfigPanel } from "./node-config-panel";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Save,
  Zap,
  Play,
  MoreHorizontal,
} from "lucide-react";

export function WorkflowCanvas() {
  const {
    getActiveWorkflow,
    closeCanvas,
    selectNode,
    selectedNodeId,
    addEdge,
    removeEdge,
    isPaletteOpen,
    setPaletteOpen,
    canvasOffset,
    setCanvasOffset,
    canvasZoom,
    setCanvasZoom,
    connectingFrom,
    setConnectingFrom,
  } = useAutomationStore();

  const workflow = getActiveWorkflow();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Pan canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Only pan if clicking on the canvas background, not a node
    if ((e.target as HTMLElement).closest(".workflow-node-container")) return;

    selectNode(null);
    setSelectedEdgeId(null);

    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: canvasOffset.x,
      offsetY: canvasOffset.y,
    };
    setIsPanning(true);
  };

  useEffect(() => {
    if (!isPanning) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!panRef.current) return;
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setCanvasOffset({
        x: panRef.current.offsetX + dx,
        y: panRef.current.offsetY + dy,
      });
    };

    const onMouseUp = () => {
      setIsPanning(false);
      panRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isPanning, setCanvasOffset]);

  // Zoom with scroll wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setCanvasZoom(canvasZoom + delta);
    },
    [canvasZoom, setCanvasZoom]
  );

  // Track mouse position for temp edge drawing
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left - canvasOffset.x) / canvasZoom,
      y: (e.clientY - rect.top - canvasOffset.y) / canvasZoom,
    });
  };

  // Handle connecting edges
  const handleStartConnect = (nodeId: string, portId: string, _isOutput: boolean) => {
    setConnectingFrom({ nodeId, portId });
  };

  const handleEndConnect = (nodeId: string, portId: string) => {
    if (connectingFrom && connectingFrom.nodeId !== nodeId) {
      addEdge({
        sourceNodeId: connectingFrom.nodeId,
        sourcePortId: connectingFrom.portId,
        targetNodeId: nodeId,
        targetPortId: portId,
      });
    }
    setConnectingFrom(null);
  };

  // Global mouseup handler for drag-to-connect edge creation
  useEffect(() => {
    if (!connectingFrom) return;

    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Find element under cursor
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const portEl = el?.closest("[data-port-id]");

      if (portEl) {
        const targetNodeId = portEl.getAttribute("data-node-id");
        const targetPortId = portEl.getAttribute("data-port-id");

        if (targetNodeId && targetPortId && targetNodeId !== connectingFrom.nodeId) {
          addEdge({
            sourceNodeId: connectingFrom.nodeId,
            sourcePortId: connectingFrom.portId,
            targetNodeId,
            targetPortId,
          });
        }
      }
      setConnectingFrom(null);
    };

    // Small delay so click event doesn't trigger immediately
    const timeoutId = setTimeout(() => {
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [connectingFrom, addEdge, setConnectingFrom]);

  // Delete selected edge
  const handleDeleteSelectedEdge = () => {
    if (selectedEdgeId) {
      removeEdge(selectedEdgeId);
      setSelectedEdgeId(null);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedEdgeId) {
          handleDeleteSelectedEdge();
        }
      }
      if (e.key === "Escape") {
        setConnectingFrom(null);
        selectNode(null);
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!workflow) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f0f11] text-zinc-500">
        <p className="text-sm">No workflow selected</p>
      </div>
    );
  }

  // Get source node for temp edge
  const connectingSourceNode = connectingFrom
    ? workflow.nodes.find((n) => n.id === connectingFrom.nodeId)
    : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0c] relative">
      {/* ── Canvas Toolbar ── */}
      <div className="flex items-center justify-between h-9 px-3 border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-sm shrink-0 z-30">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-200 max-w-[200px] truncate">
              {workflow.name}
            </span>
          </div>
          <span className="text-[10px] text-zinc-600">
            {workflow.nodes.length} nodes · {workflow.edges.length} connections
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Add Node */}
          <button
            onClick={() => setPaletteOpen(!isPaletteOpen)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
              isPaletteOpen
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/60"
            }`}
          >
            <Plus className="h-3 w-3" />
            Add Node
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 ml-2 border-l border-zinc-800 pl-2">
            <button
              onClick={() => setCanvasZoom(canvasZoom - 0.15)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] text-zinc-500 w-10 text-center font-mono">
              {Math.round(canvasZoom * 100)}%
            </span>
            <button
              onClick={() => setCanvasZoom(canvasZoom + 0.15)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setCanvasZoom(1);
                setCanvasOffset({ x: 0, y: 0 });
              }}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              title="Reset View"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Run (placeholder) */}
          <div className="flex items-center gap-0.5 ml-2 border-l border-zinc-800 pl-2">
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 opacity-50 cursor-not-allowed"
              disabled
              title="Run (coming soon)"
            >
              <Play className="h-3 w-3" />
              Run
            </button>
          </div>

          {/* Close Canvas */}
          <button
            onClick={closeCanvas}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 ml-2"
            title="Close Canvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Canvas Area ── */}
      <div
        ref={canvasRef}
        className={`flex-1 overflow-hidden relative ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        onMouseMove={handleCanvasMouseMove}
        style={{
          backgroundImage: `radial-gradient(circle, #27272a ${1 / canvasZoom}px, transparent ${1 / canvasZoom}px)`,
          backgroundSize: `${24 * canvasZoom}px ${24 * canvasZoom}px`,
          backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
        }}
      >
        {/* Transform container */}
        <div
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasZoom})`,
            transformOrigin: "0 0",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          {/* SVG for edges */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            <g className="pointer-events-auto">
              {workflow.edges.map((edge) => {
                const sourceNode = workflow.nodes.find(
                  (n) => n.id === edge.sourceNodeId
                );
                const targetNode = workflow.nodes.find(
                  (n) => n.id === edge.targetNodeId
                );
                if (!sourceNode || !targetNode) return null;

                return (
                  <WorkflowEdge
                    key={edge.id}
                    edge={edge}
                    sourceNode={sourceNode}
                    targetNode={targetNode}
                    isSelected={selectedEdgeId === edge.id}
                    onSelect={(id) => {
                      setSelectedEdgeId(id);
                      selectNode(null);
                    }}
                    onDelete={(id) => {
                      removeEdge(id);
                      setSelectedEdgeId(null);
                    }}
                    zoom={canvasZoom}
                  />
                );
              })}

              {/* Temporary edge being drawn */}
              {connectingFrom && connectingSourceNode && (
                <path
                  d={makeBezierPath(
                    ...Object.values(
                      getPortPosition(
                        connectingSourceNode,
                        connectingFrom.portId,
                        true
                      )
                    ) as [number, number],
                    mousePos.x,
                    mousePos.y
                  )}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2 / canvasZoom}
                  strokeDasharray={`${6 / canvasZoom} ${4 / canvasZoom}`}
                  opacity={0.7}
                  className="pointer-events-none"
                />
              )}
            </g>
          </svg>

          {/* Nodes */}
          {workflow.nodes.map((node) => (
            <div key={node.id} className="workflow-node-container">
              <WorkflowNode
                node={node}
                isSelected={selectedNodeId === node.id}
                zoom={canvasZoom}
                onStartConnect={handleStartConnect}
                onEndConnect={handleEndConnect}
              />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {workflow.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <Zap className="h-7 w-7 text-amber-500/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">
                  Empty Workflow
                </p>
                <p className="text-xs text-zinc-600 mt-0.5 max-w-[240px]">
                  Click &ldquo;+ Add Node&rdquo; in the toolbar to start building your automation
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Node Palette Overlay ── */}
      {isPaletteOpen && <NodePalette />}

      {/* ── Node Config Panel (right side) ── */}
      {selectedNodeId && <NodeConfigPanel />}
    </div>
  );
}
