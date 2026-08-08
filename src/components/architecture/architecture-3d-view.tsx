"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useArchitecture3DStore, ArchitectureNode3D } from "@/stores/architecture-3d-store";
import { generateDefaultArchitecture } from "@/lib/architecture/codebase-analyzer";
import { useEditorStore } from "@/stores/editor-store";
import {
  Box,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  AlertTriangle,
  FileCode,
  Layers,
  Database,
  ShieldCheck,
  Zap,
  Activity,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

export function Architecture3DView() {
  const mountRef = useRef<HTMLDivElement>(null);
  const {
    nodes,
    connections,
    setNodes,
    setConnections,
    selectedNodeId,
    selectNode,
    searchQuery,
    setSearchQuery,
    isDataFlowActive,
    toggleDataFlow,
    focusOnNode,
    cameraTarget,
    impactAnalysis,
    triggerImpactAnalysis,
    clearImpactAnalysis,
    runAISearch,
    aiQueryResult,
    isFullScreen,
    toggleFullScreen,
    setIsOpen,
  } = useArchitecture3DStore();

  const { openTab } = useEditorStore();
  const [searchInput, setSearchInput] = useState("");
  const [aiPromptInput, setAiPromptInput] = useState("");

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Initialize 3D Architecture Data on mount
  useEffect(() => {
    if (nodes.length === 0) {
      const { nodes: initialNodes, connections: initialConnections } = generateDefaultArchitecture();
      setNodes(initialNodes);
      setConnections(initialConnections);
    }
  }, [nodes, setNodes, setConnections]);

  // Setup Three.js WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#09090b");
    scene.fog = new THREE.FogExp2("#09090b", 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 14, 22);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 3, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // 3D Grid Floor
    const gridHelper = new THREE.GridHelper(40, 40, 0x3f3f46, 0x18181b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Particle Stars Background
    const particleCount = 200;
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      particlePositions[i] = (Math.random() - 0.5) * 80;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.15,
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.6,
    });
    const particleSystem = new THREE.Points(particlesGeo, particleMat);
    scene.add(particleSystem);

    // Build 3D Architecture Nodes
    nodeMeshesRef.current.clear();

    nodes.forEach((node) => {
      const geometry = new THREE.BoxGeometry(node.size[0], node.size[1], node.size[2]);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        roughness: 0.3,
        metalness: 0.7,
        emissive: new THREE.Color(node.color),
        emissiveIntensity: selectedNodeId === node.id ? 0.5 : 0.15,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.position[0], node.position[1], node.position[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { id: node.id, filePath: node.filePath, name: node.name };

      // Glow Edges Box
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      mesh.add(wireframe);

      scene.add(mesh);
      nodeMeshesRef.current.set(node.id, mesh);
    });

    // Build 3D Connection Lines & Particles
    connections.forEach((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.fromId);
      const toNode = nodes.find((n) => n.id === conn.toId);
      if (!fromNode || !toNode) return;

      const start = new THREE.Vector3(...fromNode.position);
      const end = new THREE.Vector3(...toNode.position);

      const points = [start, new THREE.Vector3((start.x + end.x) / 2, Math.max(start.y, end.y) + 2, (start.z + end.z) / 2), end];
      const curve = new THREE.CatmullRomCurve3(points);
      const lineGeo = new THREE.TubeGeometry(curve, 20, 0.08, 8, false);
      const lineMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(conn.color || "#3b82f6"),
        transparent: true,
        opacity: 0.6,
      });
      const tubeMesh = new THREE.Mesh(lineGeo, lineMat);
      scene.add(tubeMesh);
    });

    // Click Selection Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Array.from(nodeMeshesRef.current.values()));

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const nodeId = clickedMesh.userData.id;
        const filePath = clickedMesh.userData.filePath;

        selectNode(nodeId);

        // Click -> Open File in Code Editor
        if (filePath) {
          openTab({
            id: `file-${nodeId}`,
            fileId: `file-${nodeId}`,
            name: filePath.split("/").pop() || filePath,
            path: filePath,
            content: `// Code for ${clickedMesh.userData.name}\n// Path: ${filePath}\n`,
            language: filePath.endsWith(".tsx") || filePath.endsWith(".ts") ? "typescript" : "javascript",
          });
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Rotate particle background slightly
      particleSystem.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [nodes, connections, selectNode, openTab, selectedNodeId]);

  // Smooth Camera Animation when cameraTarget changes
  useEffect(() => {
    if (!cameraTarget || !cameraRef.current || !controlsRef.current) return;
    const [tx, ty, tz] = cameraTarget;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // Set new lookAt target and camera position
    controls.target.set(tx, ty, tz);
    camera.position.set(tx, ty + 10, tz + 14);
    controls.update();
  }, [cameraTarget]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleAISearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;
    runAISearch(aiPromptInput);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#09090b] text-zinc-100 select-none">
      {/* ── Top Header Toolbar ── */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-2.5 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wide text-zinc-100 flex items-center gap-2">
              Codebase 3D Architecture
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                LIVE 3D WEBGL
              </span>
            </h2>
            <p className="text-[10px] text-zinc-400">Interactive Codebase Intelligence & Dependency Graph</p>
          </div>
        </div>

        {/* AI Camera Search & Controls */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleAISearchSubmit} className="relative flex items-center">
            <Sparkles className="absolute left-2.5 h-3.5 w-3.5 text-indigo-400" />
            <input
              type="text"
              value={aiPromptInput}
              onChange={(e) => setAiPromptInput(e.target.value)}
              placeholder="AI Command: 'Where is auth handled?'"
              className="w-64 rounded-lg border border-indigo-500/30 bg-indigo-950/40 pl-8 pr-3 py-1 text-xs text-zinc-100 placeholder-zinc-400 outline-none focus:border-indigo-400"
            />
          </form>

          <button
            onClick={() => triggerImpactAnalysis("src/lib/architecture/codebase-analyzer.ts")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow"
            title="Simulate Code Change Impact Analysis"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Change Impact
          </button>

          <button
            onClick={toggleDataFlow}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shadow ${
              isDataFlowActive
                ? "bg-blue-600 text-white border-blue-400 shadow-blue-500/30"
                : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
            }`}
          >
            <Activity className="h-3.5 w-3.5" /> {isDataFlowActive ? "Data Flow Active" : "Data Flow Mode"}
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300"
            title="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300"
            title="Close 3D View"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── AI Response Banner ── */}
      {aiQueryResult && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/90 border border-indigo-500/50 shadow-2xl text-xs backdrop-blur animate-in fade-in duration-200">
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          <span className="text-indigo-200 font-medium">{aiQueryResult}</span>
        </div>
      )}

      {/* ── Change Impact Warning Banner ── */}
      {impactAnalysis && (
        <div className="absolute top-14 left-4 z-30 max-w-sm rounded-xl bg-amber-950/90 border border-amber-500/50 p-3.5 shadow-2xl backdrop-blur animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Change Impact Analysis</span>
            </div>
            <button onClick={clearImpactAnalysis} className="text-zinc-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-amber-100 font-medium mb-2">{impactAnalysis.warningMessage}</p>
          <div className="space-y-1 text-[11px] text-zinc-300 font-mono">
            <div>• Affected Components: {impactAnalysis.affectedComponents.slice(0, 4).join(", ")}</div>
            <div>• Affected APIs: {impactAnalysis.affectedAPIs.join(", ")}</div>
          </div>
        </div>
      )}

      {/* ── Main 3D Canvas ── */}
      <div ref={mountRef} className="relative flex-1 h-full w-full cursor-grab active:cursor-grabbing" />

      {/* ── Bottom Floating Selected Node Info Card ── */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-30 w-80 rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 shadow-2xl backdrop-blur animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full shadow"
                style={{ backgroundColor: selectedNode.color }}
              />
              <span className="font-bold text-xs text-zinc-100">{selectedNode.name}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
              {selectedNode.type.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-zinc-400 mb-3">{selectedNode.description}</p>

          {selectedNode.filePath && (
            <button
              onClick={() =>
                openTab({
                  id: `file-${selectedNode.id}`,
                  fileId: `file-${selectedNode.id}`,
                  name: selectedNode.filePath!.split("/").pop() || selectedNode.filePath!,
                  path: selectedNode.filePath!,
                  content: `// Source file for ${selectedNode.name}\n`,
                  language: "typescript",
                })
              }
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow"
            >
              <FileCode className="h-3.5 w-3.5" /> Open Code ({selectedNode.filePath.split("/").pop()})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
