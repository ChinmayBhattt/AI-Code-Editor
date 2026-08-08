"use client";

import type { AutomationEdge, AutomationNode } from "@/types/automation";

interface WorkflowEdgeProps {
  edge: AutomationEdge;
  sourceNode: AutomationNode;
  targetNode: AutomationNode;
  isSelected: boolean;
  onSelect: (edgeId: string) => void;
  onDelete: (edgeId: string) => void;
  zoom: number;
}

function getPortPosition(
  node: AutomationNode,
  portId: string,
  isOutput: boolean
): { x: number; y: number } {
  if (!node) return { x: 0, y: 0 };
  const nx = typeof node.x === "number" ? node.x : 0;
  const ny = typeof node.y === "number" ? node.y : 0;
  const nw = typeof node.width === "number" ? node.width : 220;
  const nh = typeof node.height === "number" ? node.height : 80;

  const ports = (isOutput ? node.outputs : node.inputs) || [];
  let portIndex = ports.findIndex((p) => p?.id === portId);
  if (portIndex < 0) portIndex = 0;
  const portCount = Math.max(1, ports.length);
  const spacing = nh / (portCount + 1);

  return {
    x: isOutput ? nx + nw : nx,
    y: ny + spacing * (portIndex + 1),
  };
}

function makeBezierPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number
): string {
  if (isNaN(sx) || isNaN(sy) || isNaN(tx) || isNaN(ty)) {
    return "M 0 0";
  }

  const dx = tx - sx;
  const dy = ty - sy;

  if (dx >= 40) {
    const controlOffset = Math.max(50, dx * 0.4);
    return `M ${sx} ${sy} C ${sx + controlOffset} ${sy}, ${tx - controlOffset} ${ty}, ${tx} ${ty}`;
  }

  const controlOffset = Math.max(60, Math.abs(dy) * 0.4);
  return `M ${sx} ${sy} C ${sx + controlOffset} ${sy}, ${tx - controlOffset} ${ty}, ${tx} ${ty}`;
}

export function WorkflowEdge({
  edge,
  sourceNode,
  targetNode,
  isSelected,
  onSelect,
  onDelete,
  zoom,
}: WorkflowEdgeProps) {
  const source = getPortPosition(sourceNode, edge.sourcePortId, true);
  const target = getPortPosition(targetNode, edge.targetPortId, false);
  const path = makeBezierPath(source.x, source.y, target.x, target.y);

  return (
    <g className="workflow-edge-group">
      {/* Invisible wider hit area for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={14 / zoom}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(edge.id);
        }}
      />

      {/* Visible edge path */}
      <path
        d={path}
        fill="none"
        stroke={isSelected ? "#f59e0b" : "#3f3f46"}
        strokeWidth={(isSelected ? 2.5 : 1.8) / zoom}
        strokeLinecap="round"
        className="transition-colors duration-150"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(edge.id);
        }}
        style={{ cursor: "pointer" }}
      />

      {/* Animated flow dots */}
      <circle r={3 / zoom} fill="#f59e0b" opacity={0.8}>
        <animateMotion dur="2s" repeatCount="indefinite" path={path} />
      </circle>

      {/* Delete button on selected edge */}
      {isSelected && (
        <g
          transform={`translate(${(source.x + target.x) / 2}, ${(source.y + target.y) / 2})`}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(edge.id);
          }}
        >
          <circle r={10 / zoom} fill="#18181b" stroke="#ef4444" strokeWidth={1.5 / zoom} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ef4444"
            fontSize={12 / zoom}
            fontWeight="bold"
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
}

// Export the helper for use in canvas temp edge drawing
export { getPortPosition, makeBezierPath };
