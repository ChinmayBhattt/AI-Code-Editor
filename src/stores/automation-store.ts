import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AutomationNode,
  AutomationEdge,
  AutomationWorkflow,
  NodeTemplate,
  NODE_TEMPLATES,
} from "@/types/automation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AutomationState {
  workflows: AutomationWorkflow[];
  activeWorkflowId: string | null;
  selectedNodeId: string | null;
  isCanvasActive: boolean;
  isPaletteOpen: boolean;
  canvasOffset: { x: number; y: number };
  canvasZoom: number;
  connectingFrom: { nodeId: string; portId: string } | null;

  // Execution state
  isExecuting: boolean;
  nodeStatuses: Record<string, "idle" | "running" | "success" | "error">;
  nodeOutputs: Record<string, unknown>;

  // Execution actions
  setExecuting: (executing: boolean) => void;
  setNodeStatus: (
    nodeId: string,
    status: "idle" | "running" | "success" | "error",
    output?: unknown
  ) => void;
  resetExecutionState: () => void;

  // Workflow CRUD
  createWorkflow: (name?: string) => void;
  deleteWorkflow: (id: string) => void;
  renameWorkflow: (id: string, name: string) => void;
  loadWorkflow: (id: string) => void;
  closeCanvas: () => void;
  applyGeneratedWorkflow: (data: {
    name?: string;
    nodes: Array<{
      id?: string;
      type: string;
      label?: string;
      x?: number;
      y?: number;
      config?: Record<string, unknown>;
      inputs?: Array<{ id: string; label: string }>;
      outputs?: Array<{ id: string; label: string }>;
    }>;
    edges: Array<{
      sourceNodeId?: string;
      sourcePortId?: string;
      targetNodeId?: string;
      targetPortId?: string;
      sourceIndex?: number;
      targetIndex?: number;
    }>;
  }) => void;

  // Node operations
  addNode: (template: NodeTemplate, x: number, y: number) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<AutomationNode>) => void;
  moveNode: (nodeId: string, x: number, y: number) => void;
  selectNode: (nodeId: string | null) => void;

  // Edge operations
  addEdge: (edge: Omit<AutomationEdge, "id">) => void;
  removeEdge: (edgeId: string) => void;

  // Canvas controls
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setCanvasZoom: (zoom: number) => void;
  setPaletteOpen: (open: boolean) => void;
  setConnectingFrom: (from: { nodeId: string; portId: string } | null) => void;

  // Getters
  getActiveWorkflow: () => AutomationWorkflow | undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function updateActiveWorkflow(
  state: AutomationState,
  updater: (workflow: AutomationWorkflow) => AutomationWorkflow
): Partial<AutomationState> {
  if (!state.activeWorkflowId) return {};
  const workflows = state.workflows.map((w) =>
    w.id === state.activeWorkflowId
      ? updater({ ...w, updatedAt: new Date().toISOString() })
      : w
  );
  return { workflows };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set, get) => ({
      workflows: [],
      activeWorkflowId: null,
      selectedNodeId: null,
      isCanvasActive: false,
      isPaletteOpen: false,
      canvasOffset: { x: 0, y: 0 },
      canvasZoom: 1,
      connectingFrom: null,

      // Execution defaults
      isExecuting: false,
      nodeStatuses: {},
      nodeOutputs: {},

      setExecuting: (executing) => set({ isExecuting: executing }),

      setNodeStatus: (nodeId, status, output) =>
        set((state) => ({
          nodeStatuses: { ...state.nodeStatuses, [nodeId]: status },
          ...(output !== undefined
            ? { nodeOutputs: { ...state.nodeOutputs, [nodeId]: output } }
            : {}),
        })),

      resetExecutionState: () =>
        set({
          isExecuting: false,
          nodeStatuses: {},
          nodeOutputs: {},
        }),

      // ── Workflow CRUD ──

      createWorkflow: (name) => {
        const newWorkflow: AutomationWorkflow = {
          id: crypto.randomUUID(),
          name: name || `Workflow ${get().workflows.length + 1}`,
          description: "",
          nodes: [],
          edges: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({
          workflows: [newWorkflow, ...get().workflows],
          activeWorkflowId: newWorkflow.id,
          isCanvasActive: true,
          selectedNodeId: null,
          canvasOffset: { x: 0, y: 0 },
          canvasZoom: 1,
          isPaletteOpen: false,
          connectingFrom: null,
        });
      },

      deleteWorkflow: (id) => {
        const { activeWorkflowId } = get();
        set({
          workflows: get().workflows.filter((w) => w.id !== id),
          ...(activeWorkflowId === id
            ? {
                activeWorkflowId: null,
                isCanvasActive: false,
                selectedNodeId: null,
              }
            : {}),
        });
      },

      renameWorkflow: (id, name) => {
        set({
          workflows: get().workflows.map((w) =>
            w.id === id ? { ...w, name, updatedAt: new Date().toISOString() } : w
          ),
        });
      },

      loadWorkflow: (id) => {
        const workflow = get().workflows.find((w) => w.id === id);
        if (workflow) {
          set({
            activeWorkflowId: id,
            isCanvasActive: true,
            selectedNodeId: null,
            canvasOffset: { x: 0, y: 0 },
            canvasZoom: 1,
            isPaletteOpen: false,
            connectingFrom: null,
          });
        }
      },

      closeCanvas: () => {
        set({
          isCanvasActive: false,
          activeWorkflowId: null,
          selectedNodeId: null,
          isPaletteOpen: false,
          connectingFrom: null,
        });
      },

      applyGeneratedWorkflow: (data) => {
        const state = get();
        let currentWorkflow = state.workflows.find(
          (w) => w.id === state.activeWorkflowId
        );

        if (!currentWorkflow) {
          const newId = crypto.randomUUID();
          currentWorkflow = {
            id: newId,
            name: data.name || "AI Generated Workflow",
            description: "",
            nodes: [],
            edges: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set({
            workflows: [currentWorkflow, ...state.workflows],
            activeWorkflowId: newId,
            isCanvasActive: true,
          });
        }

        // Convert raw nodes to full AutomationNode objects
        const newNodes: AutomationNode[] = (data.nodes || []).map((n, idx) => {
          const typeStr = (n.type || "trigger").toLowerCase();
          const template =
            NODE_TEMPLATES.find(
              (t) =>
                t.type === typeStr ||
                t.label.toLowerCase() === (n.label || "").toLowerCase()
            ) || NODE_TEMPLATES[0];

          const nodeId =
            n.id || `node-${idx + 1}-${crypto.randomUUID().slice(0, 4)}`;

          return {
            id: nodeId,
            type: (template ? template.type : "trigger") as any,
            label: n.label || template.label,
            x: n.x ?? 120 + idx * 280,
            y: n.y ?? 160,
            width: 220,
            height: 80,
            config: { ...template.defaultConfig, ...(n.config || {}) },
            inputs: n.inputs || template.inputs.map((p) => ({ ...p })),
            outputs: n.outputs || template.outputs.map((p) => ({ ...p })),
          };
        });

        // Convert raw edges
        const newEdges: AutomationEdge[] = (data.edges || []).map((e, idx) => {
          let sourceId = e.sourceNodeId;
          let targetId = e.targetNodeId;

          if (e.sourceIndex !== undefined && newNodes[e.sourceIndex]) {
            sourceId = newNodes[e.sourceIndex].id;
          }
          if (e.targetIndex !== undefined && newNodes[e.targetIndex]) {
            targetId = newNodes[e.targetIndex].id;
          }

          const sourceNode =
            newNodes.find((n) => n.id === sourceId) || newNodes[0];
          const targetNode =
            newNodes.find((n) => n.id === targetId) || newNodes[1];

          if (!sourceNode || !targetNode) {
            return null;
          }

          const sourcePortId =
            e.sourcePortId || sourceNode.outputs[0]?.id || "out";
          const targetPortId =
            e.targetPortId || targetNode.inputs[0]?.id || "in";

          return {
            id: `edge-${idx + 1}-${crypto.randomUUID().slice(0, 4)}`,
            sourceNodeId: sourceNode.id,
            sourcePortId,
            targetNodeId: targetNode.id,
            targetPortId,
          };
        }).filter(Boolean) as AutomationEdge[];

        set((s) =>
          updateActiveWorkflow(s, (w) => ({
            ...w,
            name: data.name || w.name,
            nodes: newNodes,
            edges: newEdges,
          }))
        );
      },

      // ── Node Operations ──

      addNode: (template, x, y) => {
        const node: AutomationNode = {
          id: crypto.randomUUID(),
          type: template.type,
          label: template.label,
          x,
          y,
          width: 220,
          height: 80,
          config: { ...template.defaultConfig },
          inputs: template.inputs.map((p) => ({ ...p })),
          outputs: template.outputs.map((p) => ({ ...p })),
        };
        set((state) => ({
          ...updateActiveWorkflow(state, (w) => ({
            ...w,
            nodes: [...w.nodes, node],
          })),
          isPaletteOpen: false,
        }));
      },

      removeNode: (nodeId) => {
        set((state) => ({
          ...updateActiveWorkflow(state, (w) => ({
            ...w,
            nodes: w.nodes.filter((n) => n.id !== nodeId),
            edges: w.edges.filter(
              (e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
            ),
          })),
          selectedNodeId:
            state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        }));
      },

      updateNode: (nodeId, updates) => {
        set((state) =>
          updateActiveWorkflow(state, (w) => ({
            ...w,
            nodes: w.nodes.map((n) =>
              n.id === nodeId ? { ...n, ...updates } : n
            ),
          }))
        );
      },

      moveNode: (nodeId, x, y) => {
        set((state) =>
          updateActiveWorkflow(state, (w) => ({
            ...w,
            nodes: w.nodes.map((n) =>
              n.id === nodeId ? { ...n, x, y } : n
            ),
          }))
        );
      },

      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

      // ── Edge Operations ──

      addEdge: (edgeData) => {
        const edge: AutomationEdge = {
          id: crypto.randomUUID(),
          ...edgeData,
        };
        set((state) => {
          // Prevent duplicate edges
          const workflow = state.workflows.find(
            (w) => w.id === state.activeWorkflowId
          );
          if (workflow) {
            const exists = workflow.edges.some(
              (e) =>
                e.sourceNodeId === edge.sourceNodeId &&
                e.sourcePortId === edge.sourcePortId &&
                e.targetNodeId === edge.targetNodeId &&
                e.targetPortId === edge.targetPortId
            );
            if (exists) return {};
          }

          return {
            ...updateActiveWorkflow(state, (w) => ({
              ...w,
              edges: [...w.edges, edge],
            })),
            connectingFrom: null,
          };
        });
      },

      removeEdge: (edgeId) => {
        set((state) =>
          updateActiveWorkflow(state, (w) => ({
            ...w,
            edges: w.edges.filter((e) => e.id !== edgeId),
          }))
        );
      },

      // ── Canvas Controls ──

      setCanvasOffset: (offset) => set({ canvasOffset: offset }),
      setCanvasZoom: (zoom) =>
        set({ canvasZoom: Math.max(0.25, Math.min(2, zoom)) }),
      setPaletteOpen: (open) => set({ isPaletteOpen: open }),
      setConnectingFrom: (from) => set({ connectingFrom: from }),

      // ── Getters ──

      getActiveWorkflow: () => {
        const state = get();
        return state.workflows.find((w) => w.id === state.activeWorkflowId);
      },
    }),
    {
      name: "ai-code-studio-automations",
      partialize: (state) => ({
        workflows: state.workflows,
      }),
    }
  )
);
