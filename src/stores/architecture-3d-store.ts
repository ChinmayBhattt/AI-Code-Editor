import { create } from "zustand";

export interface ArchitectureNode3D {
  id: string;
  name: string;
  type: "frontend" | "backend" | "auth" | "database" | "api" | "service" | "store" | "file";
  filePath?: string;
  position: [number, number, number]; // [x, y, z]
  size: [number, number, number]; // [width, height, depth]
  color: string;
  status: "healthy" | "warning" | "error";
  description: string;
  connections: string[]; // target node IDs
  metrics?: {
    filesCount?: number;
    linesOfCode?: number;
    dependencies?: number;
  };
}

export interface ArchitectureConnection3D {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  type: "data_flow" | "import" | "api_call" | "db_query";
  color?: string;
}

export interface ImpactAnalysis {
  changedFile: string;
  affectedComponents: string[];
  affectedAPIs: string[];
  affectedWorkflows: string[];
  warningMessage: string;
}

interface Architecture3DState {
  isOpen: boolean;
  isFullScreen: boolean;
  nodes: ArchitectureNode3D[];
  connections: ArchitectureConnection3D[];
  selectedNodeId: string | null;
  highlightedNodeIds: string[];
  searchQuery: string;
  isDataFlowActive: boolean;
  activeFlowStep: number;
  cameraTarget: [number, number, number] | null;
  impactAnalysis: ImpactAnalysis | null;
  aiQueryResult: string | null;

  // Actions
  setIsOpen: (isOpen: boolean) => void;
  toggleFullScreen: () => void;
  setNodes: (nodes: ArchitectureNode3D[]) => void;
  setConnections: (connections: ArchitectureConnection3D[]) => void;
  selectNode: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleDataFlow: () => void;
  focusOnNode: (nodeId: string) => void;
  runAISearch: (prompt: string) => void;
  triggerImpactAnalysis: (filePath: string) => void;
  clearImpactAnalysis: () => void;
}

export const useArchitecture3DStore = create<Architecture3DState>((set, get) => ({
  isOpen: false,
  isFullScreen: true,
  nodes: [],
  connections: [],
  selectedNodeId: null,
  highlightedNodeIds: [],
  searchQuery: "",
  isDataFlowActive: false,
  activeFlowStep: 0,
  cameraTarget: null,
  impactAnalysis: null,
  aiQueryResult: null,

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
  setNodes: (nodes) => set({ nodes }),
  setConnections: (connections) => set({ connections }),

  selectNode: (id) => {
    if (!id) {
      set({ selectedNodeId: null, highlightedNodeIds: [] });
      return;
    }
    const node = get().nodes.find((n) => n.id === id);
    const connectedIds = node ? [id, ...node.connections] : [id];
    set({ selectedNodeId: id, highlightedNodeIds: connectedIds });
  },

  setSearchQuery: (query) => {
    const q = query.toLowerCase().trim();
    set({ searchQuery: query });
    if (!q) {
      set({ highlightedNodeIds: [] });
      return;
    }

    const matched = get().nodes.filter(
      (n) => n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q) || (n.filePath && n.filePath.toLowerCase().includes(q))
    );

    if (matched.length > 0) {
      set({
        highlightedNodeIds: matched.map((m) => m.id),
        cameraTarget: matched[0].position,
      });
    }
  },

  toggleDataFlow: () => set((state) => ({ isDataFlowActive: !state.isDataFlowActive })),

  focusOnNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (node) {
      set({
        selectedNodeId: nodeId,
        highlightedNodeIds: [nodeId, ...node.connections],
        cameraTarget: node.position,
      });
    }
  },

  runAISearch: (prompt) => {
    const { generateArchitectureFromPrompt } = require("@/lib/architecture/codebase-analyzer");
    const { nodes: newNodes, connections: newConnections, aiMessage } = generateArchitectureFromPrompt(prompt);

    set({
      nodes: newNodes,
      connections: newConnections,
      isOpen: true,
      selectedNodeId: newNodes[0]?.id || null,
      highlightedNodeIds: newNodes.map((n: any) => n.id),
      cameraTarget: newNodes[0]?.position || [0, 2, 0],
      aiQueryResult: aiMessage,
    });
  },

  triggerImpactAnalysis: (filePath) => {
    const fileBasename = filePath.split("/").pop() || filePath;
    set({
      impactAnalysis: {
        changedFile: fileBasename,
        affectedComponents: ["AuthModal", "UserProfileCard", "HeaderNav", "CheckoutForm", "Sidebar", "LiveServer", "ChatInput", "WorkflowCanvas"],
        affectedAPIs: ["/api/auth/login", "/api/chat", "/api/terminal"],
        affectedWorkflows: ["User Sign-in Pipeline", "AI Code Refactor Engine"],
        warningMessage: `⚠️ Modification to ${fileBasename} may impact 8 components, 3 API routes and 2 workflows!`,
      },
    });
  },

  clearImpactAnalysis: () => set({ impactAnalysis: null }),
}));
