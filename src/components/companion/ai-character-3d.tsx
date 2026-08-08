"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useAICompanionStore, CompanionState } from "@/stores/ai-companion-store";

// Helper to create facial visor digital eyes texture
function createVisorFaceTexture(state: CompanionState) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  // Visor Background
  ctx.fillStyle = "#09090d";
  ctx.fillRect(0, 0, 256, 128);

  // Digital Eyes Color
  let eyeColor = "#3b82f6"; // Cyan Blue
  if (state === "success") eyeColor = "#10b981"; // Emerald
  if (state === "error") eyeColor = "#f43f5e"; // Crimson
  if (state === "thinking" || state === "analyzing") eyeColor = "#8b5cf6"; // Purple
  if (state === "coding" || state === "debugging") eyeColor = "#f59e0b"; // Amber

  ctx.fillStyle = eyeColor;
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = 12;

  if (state === "success") {
    // Happy Eye Arcs ^_^
    ctx.lineWidth = 10;
    ctx.strokeStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(80, 70, 22, Math.PI, 0);
    ctx.arc(176, 70, 22, Math.PI, 0);
    ctx.stroke();
  } else if (state === "error") {
    // Error X_X Eyes
    ctx.lineWidth = 10;
    ctx.strokeStyle = eyeColor;
    // Left X
    ctx.beginPath();
    ctx.moveTo(60, 45); ctx.lineTo(100, 85);
    ctx.moveTo(100, 45); ctx.lineTo(60, 85);
    // Right X
    ctx.moveTo(156, 45); ctx.lineTo(196, 85);
    ctx.moveTo(196, 45); ctx.lineTo(156, 85);
    ctx.stroke();
  } else if (state === "thinking" || state === "analyzing") {
    // Glowing Focus Oval Eyes o_o
    ctx.beginPath();
    ctx.ellipse(80, 64, 16, 24, 0, 0, Math.PI * 2);
    ctx.ellipse(176, 64, 16, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (state === "coding") {
    // Focused Code Scan Eyes >_<
    ctx.beginPath();
    ctx.ellipse(80, 64, 24, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(176, 64, 24, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Normal Friendly Round Digital Eyes •_•
    ctx.beginPath();
    ctx.arc(80, 64, 18, 0, Math.PI * 2);
    ctx.arc(176, 64, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export function AICharacter3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const { state } = useAICompanionStore();

  const sceneRef = useRef<THREE.Scene | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const visorMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const coreLightRef = useRef<THREE.PointLight | null>(null);
  const holoRingRef = useRef<THREE.Mesh | null>(null);

  // Update Face Visor Texture when Companion state changes
  useEffect(() => {
    if (visorMatRef.current) {
      visorMatRef.current.map = createVisorFaceTexture(state);
      visorMatRef.current.needsUpdate = true;
    }
  }, [state]);

  // Setup Three.js 3D WebGL Character
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 10, 7);
    scene.add(keyLight);

    const blueRimLight = new THREE.DirectionalLight(0x3b82f6, 1.8);
    blueRimLight.position.set(-5, 5, -5);
    scene.add(blueRimLight);

    // ── Build Humanoid AI Robot Avatar Group ──
    const robotGroup = new THREE.Group();
    robotGroupRef.current = robotGroup;

    // Materials
    const armorWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      metalness: 0.85,
      roughness: 0.15,
    });

    const armorDarkMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.9,
      roughness: 0.2,
    });

    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });

    // 1. Head (Rounded Metallic Helmet)
    const headGeo = new THREE.SphereGeometry(0.85, 32, 32);
    headGeo.scale(1, 0.9, 0.95);
    const headMesh = new THREE.Mesh(headGeo, armorWhiteMat);
    headMesh.position.y = 1.4;
    robotGroup.add(headMesh);

    // Head Visor Display Face
    const visorGeo = new THREE.SphereGeometry(0.78, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const visorMat = new THREE.MeshBasicMaterial({
      map: createVisorFaceTexture(state),
      transparent: true,
    });
    visorMatRef.current = visorMat;

    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.rotation.x = Math.PI / 2;
    visorMesh.position.set(0, 1.42, 0.12);
    robotGroup.add(visorMesh);

    // 2. Chest Torso Armor
    const torsoGeo = new THREE.CylinderGeometry(0.7, 0.5, 1.3, 16);
    const torsoMesh = new THREE.Mesh(torsoGeo, armorWhiteMat);
    torsoMesh.position.y = 0.1;
    robotGroup.add(torsoMesh);

    // Dark Inner Spine/Neck
    const neckGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.4, 16);
    const neckMesh = new THREE.Mesh(neckGeo, armorDarkMat);
    neckMesh.position.y = 0.9;
    robotGroup.add(neckMesh);

    // 3. Chest AI Core Crystal (Octahedron Glow)
    const coreGeo = new THREE.OctahedronGeometry(0.32, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 0.25, 0.62);
    robotGroup.add(coreMesh);

    const coreLight = new THREE.PointLight(0x3b82f6, 3, 4);
    coreLight.position.set(0, 0.25, 0.8);
    coreLightRef.current = coreLight;
    robotGroup.add(coreLight);

    // 4. Shoulder Pads & Arms
    const shoulderGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const leftShoulder = new THREE.Mesh(shoulderGeo, armorWhiteMat);
    leftShoulder.position.set(-0.95, 0.55, 0);
    robotGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, armorWhiteMat);
    rightShoulder.position.set(0.95, 0.55, 0);
    robotGroup.add(rightShoulder);

    // Forearms
    const armGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.9, 12);
    const leftArm = new THREE.Mesh(armGeo, armorDarkMat);
    leftArm.position.set(-1.05, 0.05, 0.1);
    leftArm.rotation.z = 0.25;
    robotGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armorDarkMat);
    rightArm.position.set(1.05, 0.05, 0.1);
    rightArm.rotation.z = -0.25;
    robotGroup.add(rightArm);

    // 5. Floating Holographic Code Ring around character
    const ringGeo = new THREE.TorusGeometry(1.6, 0.03, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.7 });
    const holoRing = new THREE.Mesh(ringGeo, ringMat);
    holoRing.rotation.x = Math.PI / 2.3;
    holoRing.position.y = 0.1;
    holoRingRef.current = holoRing;
    robotGroup.add(holoRing);

    scene.add(robotGroup);

    // Mouse Move Hover Tilt
    const handleMouseMove = (e: MouseEvent) => {
      if (!robotGroupRef.current) return;
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      robotGroupRef.current.rotation.y = mouseX * 0.35;
      robotGroupRef.current.rotation.x = -mouseY * 0.15;
    };
    container.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Floating Levitation Breathing Animation
      if (robotGroupRef.current) {
        robotGroupRef.current.position.y = Math.sin(elapsedTime * 2.2) * 0.12;
      }

      // Rotate Chest Core Crystal & Holographic Ring
      coreMesh.rotation.y = elapsedTime * 1.5;
      coreMesh.rotation.z = elapsedTime * 0.8;
      if (holoRingRef.current) {
        holoRingRef.current.rotation.z = -elapsedTime * 0.8;
      }

      renderer.render(scene, camera);
    };
    animate();

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
      container.removeEventListener("mousemove", handleMouseMove);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full cursor-pointer select-none" />;
}
