"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useArchitecture3DStore, ArchitectureNode3D } from "@/stores/architecture-3d-store";
import { generateDefaultArchitecture, getSingleRootArchitecture } from "@/lib/architecture/codebase-analyzer";
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

// Helper to create 3D Canvas Text Sprite Badges
function createTextSprite(text: string, subtext: string, colorStr: string, status: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Background Glass Card
  ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
  ctx.strokeStyle = colorStr;
  ctx.lineWidth = 6;
  
  // Rounded Rect
  const r = 24;
  const w = 500;
  const h = 240;
  const x = 6;
  const y = 6;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Status Badge Dot
  const dotColor = status === "warning" ? "#f59e0b" : status === "error" ? "#ef4444" : "#10b981";
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(40, 50, 14, 0, Math.PI * 2);
  ctx.fill();

  // Header Title Text
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, 70, 60);

  // Divider Line
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 95);
  ctx.lineTo(475, 95);
  ctx.stroke();

  // Subtext Info
  ctx.font = "bold 24px monospace";
  ctx.fillStyle = colorStr;
  ctx.fillText(subtext.toUpperCase(), 35, 145);

  // Status Text
  ctx.font = "22px sans-serif";
  ctx.fillStyle = "#9ca3af";
  ctx.fillText(`STATUS: ${status.toUpperCase()}`, 35, 195);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(6, 3, 1);
  return sprite;
}

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
  const nodeMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const flowParticlesRef = useRef<{ mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; progress: number }[]>([]);

  // Initialize 3D Architecture Data on mount (Starts with Single Square Block)
  useEffect(() => {
    if (nodes.length === 0) {
      const { nodes: initialNodes, connections: initialConnections } = getSingleRootArchitecture();
      setNodes(initialNodes);
      setConnections(initialConnections);
    }
  }, [nodes, setNodes, setConnections]);

  // Setup High-Detail Cyberpunk 3D WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050508");
    scene.fog = new THREE.FogExp2("#050508", 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 16, 26);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controlsRef.current = controls;

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(20, 35, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x3b82f6, 1.5);
    blueRimLight.position.set(-20, 20, -20);
    scene.add(blueRimLight);

    // High-Tech Cyber Floor Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x3b82f6, 0x1e1e2e);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Dark Floor Reflection Plane
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x07070c,
      roughness: 0.1,
      metalness: 0.9,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.05;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Floating Cyber Particles
    const particleCount = 350;
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      particlePositions[i] = (Math.random() - 0.5) * 90;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      color: 0x818cf8,
      transparent: true,
      opacity: 0.7,
    });
    const particleSystem = new THREE.Points(particlesGeo, particleMat);
    scene.add(particleSystem);

    // ── Build Realistic 3D Skyscraper Architecture Nodes ──
    nodeMeshesRef.current.clear();
    const clickables: THREE.Object3D[] = [];

    nodes.forEach((node) => {
      const group = new THREE.Group();
      group.position.set(node.position[0], 0, node.position[2]);
      const nodeColor = new THREE.Color(node.color);

      const isSelected = selectedNodeId === node.id;
      const isDatabase = node.type === "database";
      const isAuth = node.type === "auth";

      // 1. Metallic Base Foundation Ring
      const baseGeo = new THREE.CylinderGeometry(node.size[0] * 0.75, node.size[0] * 0.85, 0.4, 16);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.9,
        roughness: 0.2,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.2;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // Base Neon Glowing Ring
      const ringGeo = new THREE.TorusGeometry(node.size[0] * 0.76, 0.06, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: nodeColor });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.42;
      group.add(ringMesh);

      // 2. Main Building Body
      let mainMesh: THREE.Mesh;

      if (isDatabase) {
        // Cylindrical Pod Tower for Database
        const cylGeo = new THREE.CylinderGeometry(node.size[0] * 0.6, node.size[0] * 0.6, node.size[1], 24);
        const cylMat = new THREE.MeshPhysicalMaterial({
          color: nodeColor,
          metalness: 0.8,
          roughness: 0.2,
          transmission: 0.4,
          transparent: true,
          opacity: 0.9,
          emissive: nodeColor,
          emissiveIntensity: isSelected ? 0.6 : 0.2,
        });
        mainMesh = new THREE.Mesh(cylGeo, cylMat);
        mainMesh.position.y = node.size[1] / 2 + 0.4;

        // Stacked Storage Ring Strips
        for (let h = 1; h < node.size[1]; h += 1.2) {
          const discGeo = new THREE.TorusGeometry(node.size[0] * 0.61, 0.05, 12, 24);
          const discMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const discMesh = new THREE.Mesh(discGeo, discMat);
          discMesh.rotation.x = Math.PI / 2;
          discMesh.position.y = h - node.size[1] / 2;
          mainMesh.add(discMesh);
        }
      } else if (isAuth) {
        // Octagonal Security Fortress Body
        const octGeo = new THREE.CylinderGeometry(node.size[0] * 0.65, node.size[0] * 0.7, node.size[1], 8);
        const octMat = new THREE.MeshPhysicalMaterial({
          color: nodeColor,
          metalness: 0.9,
          roughness: 0.1,
          emissive: nodeColor,
          emissiveIntensity: isSelected ? 0.7 : 0.3,
        });
        mainMesh = new THREE.Mesh(octGeo, octMat);
        mainMesh.position.y = node.size[1] / 2 + 0.4;
      } else {
        // Multi-tier Glass Façade Skyscraper
        const boxGeo = new THREE.BoxGeometry(node.size[0], node.size[1], node.size[2]);
        const boxMat = new THREE.MeshPhysicalMaterial({
          color: nodeColor,
          metalness: 0.8,
          roughness: 0.2,
          transmission: 0.35,
          transparent: true,
          opacity: 0.92,
          emissive: nodeColor,
          emissiveIntensity: isSelected ? 0.6 : 0.2,
        });
        mainMesh = new THREE.Mesh(boxGeo, boxMat);
        mainMesh.position.y = node.size[1] / 2 + 0.4;

        // Illuminated Inner Core Mesh
        const innerGeo = new THREE.BoxGeometry(node.size[0] * 0.7, node.size[1] * 0.9, node.size[2] * 0.7);
        const innerMat = new THREE.MeshBasicMaterial({ color: nodeColor });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        mainMesh.add(innerMesh);

        // Floor Slice Frame Wireframe
        const edges = new THREE.EdgesGeometry(boxGeo);
        const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        const wireframe = new THREE.LineSegments(edges, wireMat);
        mainMesh.add(wireframe);
      }

      mainMesh.castShadow = true;
      mainMesh.receiveShadow = true;
      mainMesh.userData = { id: node.id, filePath: node.filePath, name: node.name };
      group.add(mainMesh);
      clickables.push(mainMesh);

      // 3. Rooftop Antenna & Beacon Signal Light
      const roofY = node.size[1] + 0.4;
      const antGeo = new THREE.CylinderGeometry(0.05, 0.08, 1.8, 8);
      const antMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9 });
      const antMesh = new THREE.Mesh(antGeo, antMat);
      antMesh.position.y = roofY + 0.9;
      group.add(antMesh);

      // Rooftop Beacon Sphere
      const beaconGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: node.status === "warning" ? 0xf59e0b : 0x10b981 });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.y = roofY + 1.8;
      group.add(beaconMesh);

      // Pointlight inside each building core
      const pLight = new THREE.PointLight(nodeColor, 2.5, 12);
      pLight.position.y = node.size[1] / 2;
      group.add(pLight);

      // 4. Floating 3D Text Title & Badge Sprite
      const sprite = createTextSprite(
        node.name,
        `${node.metrics?.filesCount || 8} FILES • ${node.type}`,
        node.color,
        node.status
      );
      sprite.position.y = roofY + 3.2;
      group.add(sprite);

      scene.add(group);
      nodeMeshesRef.current.set(node.id, mainMesh);
    });

    // ── Build 3D Laser Beam Connection Tubes & Flow Particles ──
    flowParticlesRef.current = [];

    connections.forEach((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.fromId);
      const toNode = nodes.find((n) => n.id === conn.toId);
      if (!fromNode || !toNode) return;

      const start = new THREE.Vector3(fromNode.position[0], fromNode.size[1] / 2 + 0.4, fromNode.position[2]);
      const end = new THREE.Vector3(toNode.position[0], toNode.size[1] / 2 + 0.4, toNode.position[2]);

      const midY = Math.max(start.y, end.y) + 3;
      const points = [
        start,
        new THREE.Vector3((start.x * 2 + end.x) / 3, midY, (start.z * 2 + end.z) / 3),
        new THREE.Vector3((start.x + end.x * 2) / 3, midY, (start.z + end.z * 2) / 3),
        end,
      ];

      const curve = new THREE.CatmullRomCurve3(points);
      const lineGeo = new THREE.TubeGeometry(curve, 30, 0.1, 10, false);
      const lineMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(conn.color || "#3b82f6"),
        transparent: true,
        opacity: 0.7,
      });
      const tubeMesh = new THREE.Mesh(lineGeo, lineMat);
      scene.add(tubeMesh);

      // Animated Glowing Data Pulse Sphere
      const pulseGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      scene.add(pulseMesh);

      flowParticlesRef.current.push({
        mesh: pulseMesh,
        curve,
        progress: Math.random(),
      });
    });

    // ── Click Selection Raycasting ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickables);

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
            content: `// Source file for ${clickedMesh.userData.name}\n// Path: ${filePath}\n`,
            language: filePath.endsWith(".tsx") || filePath.endsWith(".ts") ? "typescript" : "javascript",
          });
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // ── Animation Loop ──
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Rotate cyber starfield slightly
      particleSystem.rotation.y += 0.0004;

      // Animate Data Flow Laser Pulse Spheres along curves
      flowParticlesRef.current.forEach((item) => {
        item.progress = (item.progress + 0.008) % 1.0;
        const pos = item.curve.getPointAt(item.progress);
        item.mesh.position.copy(pos);
      });

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

    controls.target.set(tx, ty + 2, tz);
    camera.position.set(tx, ty + 12, tz + 16);
    controls.update();
  }, [cameraTarget]);

  const handleAISearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;
    runAISearch(aiPromptInput);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#050508] text-zinc-100 select-none">
      {/* ── Top Header Toolbar ── */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-2.5 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wide text-zinc-100 flex items-center gap-2">
              Codebase 3D Architecture
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                CYBER 3D WEBGL
              </span>
            </h2>
            <p className="text-[10px] text-zinc-400">Interactive Cyberpunk Building & Dependency Graph</p>
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
              placeholder="AI Search: 'Where is payment handled?'"
              className="w-64 rounded-lg border border-indigo-500/40 bg-indigo-950/50 pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none focus:border-indigo-400 shadow-inner"
            />
          </form>

          <button
            onClick={() => triggerImpactAnalysis("src/lib/architecture/codebase-analyzer.ts")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow"
            title="Simulate Code Change Impact Analysis"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Change Impact
          </button>

          <button
            onClick={toggleDataFlow}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow ${
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
