'use client';

import { Suspense, useRef, useState, useEffect, useCallback, useMemo, Component, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Environment, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Box, Maximize2, Info, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// Stage metadata for 3D synchronization
export interface StageMetadata {
  number: number;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  } | null;
  actions: Array<{
    layers: string;
    operation: string;
  }>;
  labels: Array<{
    marker: string;
    text: string;
    position: { x: number; y: number; z: number };
  }>;
}

export interface DetailStageMetadata {
  guideKey: string;
  code: string;
  title: string;
  modelFile: string;
  stages: StageMetadata[];
}

interface Model3DViewerProps {
  modelUrl?: string | null;
  detailCode: string;
  thumbnailUrl?: string | null;
  activeStep?: number;
  stageMetadata?: DetailStageMetadata | null;
  onStepChange?: (step: number) => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Error Boundary for 3D canvas errors
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class Model3DErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void; fallback: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('3D Viewer Error:', error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Parse layer action string to determine visibility
function parseLayerAction(actionStr: string): { layerName: string; visible: boolean }[] {
  const layers: { layerName: string; visible: boolean }[] = [];
  const parts = actionStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith('!Layer:')) {
      layers.push({ layerName: trimmed.substring(7), visible: false });
    } else if (trimmed.startsWith('Layer:')) {
      layers.push({ layerName: trimmed.substring(6), visible: true });
    }
  }

  return layers;
}

// Extract material colors from Verge3D's S8S_v3d_material_data extension.
// These GLBs have NO standard PBR properties — all color data is in V3D node graphs.
function extractV3DColors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parserJson: any
): Map<string, { r: number; g: number; b: number; opacity: number }> {
  const colorMap = new Map<string, { r: number; g: number; b: number; opacity: number }>();

  const materials = parserJson?.materials;
  if (!Array.isArray(materials)) return colorMap;

  for (const mat of materials) {
    const name = mat.name;
    if (!name || name === 'Verge3D_Environment') continue;

    const v3dData = mat.extensions?.S8S_v3d_material_data;
    if (!v3dData) continue;

    const nodes = v3dData.nodeGraph?.nodes;
    if (!Array.isArray(nodes)) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const materialNode = nodes.find((n: any) => n.type === 'MATERIAL_MX');
    if (!materialNode?.inputs || materialNode.inputs.length < 7) continue;

    // MATERIAL_MX inputs[1] = display color [r,g,b,a] (sRGB), inputs[6] = opacity
    const colorInput = materialNode.inputs[1];
    const opacityInput = materialNode.inputs[6];

    if (Array.isArray(colorInput) && colorInput.length >= 3) {
      colorMap.set(name, {
        r: colorInput[0],
        g: colorInput[1],
        b: colorInput[2],
        opacity: typeof opacityInput === 'number' ? opacityInput : 1.0,
      });
    }
  }

  return colorMap;
}

// Apply extracted V3D color to a cloned Three.js material
function applyV3DColor(
  material: THREE.Material,
  v3dColors: Map<string, { r: number; g: number; b: number; opacity: number }>
) {
  const v3dColor = v3dColors.get(material.name);
  if (!v3dColor) return;

  const mat = material as THREE.MeshStandardMaterial;
  if (!mat.color) return;

  // V3D stores colors in sRGB space (from 3ds Max Physical Material)
  mat.color.setRGB(v3dColor.r, v3dColor.g, v3dColor.b, THREE.SRGBColorSpace);
  mat.metalness = 0.1;
  mat.roughness = 0.4;
  // Render both sides — V3D models have single-sided geometry that disappears
  // from bird's eye view without this (back faces culled by default)
  mat.side = THREE.DoubleSide;

  if (v3dColor.opacity < 1.0) {
    mat.transparent = true;
    mat.opacity = v3dColor.opacity;
  }
}

// Model transform info passed from model loader to camera animator
interface ModelTransform {
  scale: number;
  center: THREE.Vector3;
}

// WeakMap to store original material opacity values
const originalOpacityMap = new WeakMap<THREE.Material, number>();

// Component to load and control GLB model with step sync
function GLBModelWithSteps({
  url,
  activeStep,
  stageMetadata,
  onLoad,
  onModelReady,
}: {
  url: string;
  activeStep: number;
  stageMetadata?: DetailStageMetadata | null;
  onLoad?: () => void;
  onModelReady?: (transform: ModelTransform) => void;
}) {
  const gltfResult = useGLTF(url, true, true, (loader) => {
    loader.setCrossOrigin('anonymous');
  });
  const scene = gltfResult.scene;
  const groupRef = useRef<THREE.Group>(null);
  const clonedSceneRef = useRef<THREE.Group | null>(null);

  // Extract Verge3D material colors from GLTF parser JSON
  const v3dColors = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parserJson = (gltfResult as any).parser?.json;
      return extractV3DColors(parserJson);
    } catch {
      return new Map<string, { r: number; g: number; b: number; opacity: number }>();
    }
  }, [gltfResult]);

  // Use refs for callbacks to avoid re-triggering the scene setup effect
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
  const onModelReadyRef = useRef(onModelReady);
  onModelReadyRef.current = onModelReady;

  // Initial scene setup — clone scene, clone materials, apply V3D colors, compute transform
  useEffect(() => {
    if (scene && groupRef.current) {
      const clonedScene = scene.clone(true);
      clonedSceneRef.current = clonedScene;

      // Clone each mesh's material individually and apply V3D colors
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => {
              const cloned = m.clone();
              applyV3DColor(cloned, v3dColors);
              originalOpacityMap.set(cloned, cloned.opacity);
              return cloned;
            });
          } else {
            mesh.material = mesh.material.clone();
            applyV3DColor(mesh.material, v3dColors);
            originalOpacityMap.set(mesh.material, mesh.material.opacity);
          }
        }
      });

      // Compute bounding box from MESH geometry only — Verge3D GLBs contain
      // embedded cameras/lights far from the model that skew setFromObject
      const box = new THREE.Box3();
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.computeBoundingBox();
            if (mesh.geometry.boundingBox) {
              const meshBox = mesh.geometry.boundingBox.clone();
              meshBox.applyMatrix4(mesh.matrixWorld);
              box.union(meshBox);
            }
          }
        }
      });

      // Fallback if no meshes found
      if (box.isEmpty()) {
        box.setFromObject(clonedScene);
      }

      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Scale to fit in a 2-unit box
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0 && isFinite(maxDim)) {
        const scale = 2 / maxDim;
        clonedScene.scale.setScalar(scale);

        // Center the model at origin, raised to sit on grid (y=1)
        clonedScene.position.x = -center.x * scale;
        clonedScene.position.y = -center.y * scale + 1;
        clonedScene.position.z = -center.z * scale;

        // Pass native-space center and computed scale to parent for camera animation
        onModelReadyRef.current?.({ scale, center: center.clone() });
      }

      // Clear previous children and add new
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      groupRef.current.add(clonedScene);

      onLoadRef.current?.();
    }
  }, [scene, v3dColors]);

  // Apply cumulative layer visibility + ghost/highlight transparency
  useEffect(() => {
    if (!clonedSceneRef.current || !stageMetadata) return;

    // Helper to set material opacity on a mesh
    // forceOpaque=true overrides original material opacity (used for overview)
    const setMeshOpacity = (mesh: THREE.Mesh, opacity: number, forceOpaque = false) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (opacity < 1.0) {
          mat.transparent = true;
          mat.opacity = opacity;
          mat.depthWrite = opacity > 0.1;
        } else if (forceOpaque) {
          // Force fully opaque — ignore original material transparency
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
        } else {
          const origOpacity = originalOpacityMap.get(mat) ?? 1.0;
          mat.transparent = origOpacity < 1.0;
          mat.opacity = origOpacity;
          mat.depthWrite = true;
        }
        mat.needsUpdate = true;
      }
    };

    // Step 1: Reset ALL meshes to visible and fully opaque
    // Hide Verge3D transparency effect layers (names containing "transp")
    clonedSceneRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Hide Verge3D transparency/effect layers
        if (mesh.name && mesh.name.toLowerCase().includes('transp')) {
          mesh.visible = false;
          return;
        }
        mesh.visible = true;
        setMeshOpacity(mesh, 1.0, true); // Force opaque for clean overview
      }
    });

    // Step 2: Apply actions cumulatively from stage 1 through current stage
    // This fixes the bug where jumping backwards doesn't reset layers
    const currentStageIdx = stageMetadata.stages.findIndex(s => s.number === activeStep);
    if (currentStageIdx < 0) return;

    // Track which layer names have been revealed in the current stage (for highlight)
    const currentRevealedLayers = new Set<string>();

    for (let i = 0; i <= currentStageIdx; i++) {
      const stage = stageMetadata.stages[i];
      for (const action of stage.actions) {
        const layerChanges = parseLayerAction(action.layers);
        for (const { layerName, visible } of layerChanges) {
          clonedSceneRef.current.traverse((child) => {
            if (child.name && child.name.includes(layerName)) {
              child.visible = visible;
            }
          });
        }
        // Track "reveal" operations for the CURRENT stage only
        if (i === currentStageIdx && action.operation === 'reveal') {
          const layerChanges2 = parseLayerAction(action.layers);
          for (const { layerName, visible } of layerChanges2) {
            if (visible) {
              currentRevealedLayers.add(layerName);
            }
          }
        }
      }
    }

    // Step 3: For stages 2+ apply ghost/highlight transparency
    if (activeStep > 1 && currentRevealedLayers.size > 0) {
      // First pass: ghost ALL visible meshes
      // For V3D-transparent materials (opacity < 1.0), ghost to proportionally lower opacity
      clonedSceneRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.visible) {
          const mesh = child as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

          // Check if any material has original transparency
          const hasTransparentMaterial = materials.some(mat => {
            const origOpacity = originalOpacityMap.get(mat) ?? 1.0;
            return origOpacity < 1.0;
          });

          if (hasTransparentMaterial) {
            // For transparent materials, use min(original_opacity * 0.3, 0.25)
            // This ensures already-transparent materials ghost to proportionally lower opacity
            for (const mat of materials) {
              const origOpacity = originalOpacityMap.get(mat) ?? 1.0;
              const ghostOpacity = Math.min(origOpacity * 0.3, 0.25);
              mat.transparent = true;
              mat.opacity = ghostOpacity;
              mat.depthWrite = ghostOpacity > 0.1;
              mat.needsUpdate = true;
            }
          } else {
            // For opaque materials, standard ghost at 0.25
            setMeshOpacity(mesh, 0.25);
          }
        }
      });

      // Second pass: highlight current stage's revealed components
      // Restore to V3D opacity (from originalOpacityMap), NOT 1.0
      const revealedArray = Array.from(currentRevealedLayers);
      clonedSceneRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.visible) {
          for (let r = 0; r < revealedArray.length; r++) {
            if (child.name && child.name.includes(revealedArray[r])) {
              // Restore to original V3D opacity instead of forcing 1.0
              setMeshOpacity(child as THREE.Mesh, 1.0, false);
              break;
            }
          }
        }
      });
    }
  }, [activeStep, stageMetadata]);

  return <group ref={groupRef} />;
}

// Floating 3D label markers using Html from drei
function StageLabels({
  labels,
  modelScale,
  modelCenter,
}: {
  labels: StageMetadata['labels'];
  modelScale: number;
  modelCenter: THREE.Vector3;
}) {
  const visibleLabels = labels.filter(
    (l) => l.marker && l.marker.trim() !== '' && (l.position.x !== 0 || l.position.y !== 0 || l.position.z !== 0)
  );

  if (visibleLabels.length === 0) return null;

  return (
    <>
      {visibleLabels.map((label, idx) => {
        // Transform native-space label position to scene coordinates
        const x = (label.position.x - modelCenter.x) * modelScale;
        const y = (label.position.y - modelCenter.y) * modelScale + 1;
        const z = (label.position.z - modelCenter.z) * modelScale;

        return (
          <Html
            key={`${label.marker}-${idx}`}
            position={[x, y, z]}
            distanceFactor={4}
            occlude="blending"
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#095563',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                border: '2px solid white',
                userSelect: 'none',
              }}
            >
              {label.marker.toUpperCase()}
            </div>
          </Html>
        );
      })}
    </>
  );
}

// Animate camera with gentle orbit between stages
// (Verge3D native camera positions don't translate well to our R3F scene,
// so we compute sensible orbit positions instead)
function CameraAnimator({
  controlsRef,
  activeStep,
  stageMetadata,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  activeStep: number;
  stageMetadata: DetailStageMetadata;
  modelScale: number;
  modelCenter: THREE.Vector3;
}) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(3, 3, 3));
  const targetLookAt = useRef(new THREE.Vector3(0, 1, 0));
  const isAnimating = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!controlsRef.current) return;

    // Skip animation on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Stage 1 (overview): default front-right view
    if (activeStep <= 1) {
      targetPosition.current.set(3, 3, 3);
      targetLookAt.current.set(0, 1, 0);
      isAnimating.current = true;
      return;
    }

    // For step stages: gently orbit to a different angle per stage
    // This gives visual feedback that the view changed without needing
    // the Verge3D native camera positions
    const totalStages = stageMetadata.stages.length;
    const stageIdx = activeStep - 1; // 0-based from stage 2
    const angle = (Math.PI * 0.3) + (stageIdx / Math.max(totalStages - 1, 1)) * (Math.PI * 0.8);
    const radius = 3.5;
    const height = 2.0 + (stageIdx * 0.3);

    targetPosition.current.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );
    targetLookAt.current.set(0, 1, 0);
    isAnimating.current = true;
  }, [activeStep, stageMetadata, controlsRef]);

  useFrame(() => {
    if (!isAnimating.current || !controlsRef.current) return;

    camera.position.lerp(targetPosition.current, 0.06);
    controlsRef.current.target.lerp(targetLookAt.current, 0.06);
    controlsRef.current.update();

    if (
      camera.position.distanceTo(targetPosition.current) < 0.01 &&
      controlsRef.current.target.distanceTo(targetLookAt.current) < 0.01
    ) {
      isAnimating.current = false;
    }
  });

  return null;
}

// Simple model loader without step synchronization
function ModelLoader({ url, onLoad }: {
  url: string;
  onLoad?: () => void;
}) {
  const gltfResult = useGLTF(url, true, true, (loader) => {
    loader.setCrossOrigin('anonymous');
  });
  const scene = gltfResult.scene;
  const groupRef = useRef<THREE.Group>(null);

  // Extract Verge3D material colors
  const v3dColors = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parserJson = (gltfResult as any).parser?.json;
      return extractV3DColors(parserJson);
    } catch {
      return new Map<string, { r: number; g: number; b: number; opacity: number }>();
    }
  }, [gltfResult]);

  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  useEffect(() => {
    if (scene && groupRef.current) {
      const clonedScene = scene.clone(true);

      // Clone materials and apply V3D colors
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => {
              const cloned = m.clone();
              applyV3DColor(cloned, v3dColors);
              return cloned;
            });
          } else {
            mesh.material = mesh.material.clone();
            applyV3DColor(mesh.material, v3dColors);
          }
        }
      });

      // Compute bounding box from MESH geometry only (skip embedded cameras/lights)
      const box = new THREE.Box3();
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.computeBoundingBox();
            if (mesh.geometry.boundingBox) {
              const meshBox = mesh.geometry.boundingBox.clone();
              meshBox.applyMatrix4(mesh.matrixWorld);
              box.union(meshBox);
            }
          }
        }
      });
      if (box.isEmpty()) {
        box.setFromObject(clonedScene);
      }

      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0 && isFinite(maxDim)) {
        const scale = 2 / maxDim;
        clonedScene.scale.setScalar(scale);
        clonedScene.position.x = -center.x * scale;
        clonedScene.position.y = -center.y * scale + 1;
        clonedScene.position.z = -center.z * scale;
      }

      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      groupRef.current.add(clonedScene);
      onLoadRef.current?.();
    }
  }, [scene, v3dColors]);

  return <group ref={groupRef} />;
}

function PlaceholderBox({ detailCode }: { detailCode: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[2, 0.1, 3]} />
        <meshStandardMaterial color="#4a5568" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1, -1.5]}>
        <boxGeometry args={[2, 2, 0.15]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[0, 0.6, -1.35]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[2.1, 0.02, 0.3]} />
        <meshStandardMaterial color="#f97316" metalness={0.8} roughness={0.2} />
      </mesh>
      <Text position={[0, 2.5, 0]} fontSize={0.4} color="#095563" anchorX="center" anchorY="middle">
        {detailCode}
      </Text>
      <Text position={[0, 2.1, 0]} fontSize={0.15} color="#64748b" anchorX="center" anchorY="middle">
        3D Model Placeholder
      </Text>
    </group>
  );
}

function LoadingSpinner() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#095563" wireframe />
    </mesh>
  );
}

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(3, 3, 3);
const DEFAULT_TARGET = new THREE.Vector3(0, 1, 0);

function CameraController({
  controlsRef,
  onReset,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  onReset?: () => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (onReset) {
      (window as unknown as { resetCamera?: () => void }).resetCamera = () => {
        if (controlsRef.current) {
          camera.position.copy(DEFAULT_CAMERA_POSITION);
          controlsRef.current.target.copy(DEFAULT_TARGET);
          controlsRef.current.update();
        }
      };
    }
    return () => {
      delete (window as unknown as { resetCamera?: () => void }).resetCamera;
    };
  }, [camera, controlsRef, onReset]);

  return null;
}

// Step navigation bar — [i] [1] [2] [3] ... [→/✓]
function StepBar({
  totalStages,
  activeStep,
  onStepChange,
}: {
  totalStages: number;
  activeStep: number;
  onStepChange: (step: number) => void;
}) {
  const isLastStep = activeStep >= totalStages;

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border-t border-slate-700 overflow-x-auto">
      {/* Overview button (stage 1) */}
      <button
        onClick={() => onStepChange(1)}
        className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
          activeStep === 1
            ? 'bg-[#5abfcf] text-slate-900 shadow-sm'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
        aria-label="Overview"
        title="Overview"
      >
        <Info className="h-4 w-4" />
      </button>

      {/* Numbered step buttons (stage 2, 3, 4, ...) */}
      {Array.from({ length: totalStages - 1 }, (_, i) => {
        const stageNum = i + 2; // stage 2 = step 1, stage 3 = step 2, etc.
        const stepLabel = i + 1;
        return (
          <button
            key={stageNum}
            onClick={() => onStepChange(stageNum)}
            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
              activeStep === stageNum
                ? 'bg-[#5abfcf] text-slate-900 shadow-sm'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            aria-label={`Step ${stepLabel}`}
          >
            {stepLabel}
          </button>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Advance / Finished button */}
      <button
        onClick={() => {
          if (!isLastStep) onStepChange(activeStep + 1);
        }}
        disabled={isLastStep}
        className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
          isLastStep
            ? 'bg-green-800 text-green-200'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
        aria-label={isLastStep ? 'Finished' : 'Next step'}
        title={isLastStep ? 'Finished' : 'Next step'}
      >
        {isLastStep ? (
          <Check className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

// Instruction text panel showing stage labels
function InstructionPanel({ labels }: { labels: StageMetadata['labels'] | undefined }) {
  if (!labels || labels.length === 0) return null;

  // Filter to labels that have text content
  const textLabels = labels.filter((l) => l.text && l.text.trim() !== '');
  if (textLabels.length === 0) return null;

  return (
    <div className="px-3 py-2.5 bg-slate-800/90 border-t border-slate-700 max-h-[80px] overflow-y-auto">
      <div className="space-y-1">
        {textLabels.map((label, idx) => (
          <p key={idx} className="text-xs leading-relaxed text-slate-300">
            {label.marker && label.marker.trim() !== '' ? (
              <>
                <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-[#5abfcf] text-slate-900 text-[10px] font-bold mr-1.5 align-middle uppercase">
                  {label.marker.toUpperCase()}
                </span>
                {label.text}
              </>
            ) : (
              <span className="text-slate-400 italic">{label.text}</span>
            )}
          </p>
        ))}
      </div>
    </div>
  );
}

function Fallback2D({
  detailCode,
  thumbnailUrl,
  onRetry,
  errorMessage
}: {
  detailCode: string;
  thumbnailUrl?: string | null;
  onRetry: () => void;
  errorMessage?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      {thumbnailUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={`${detailCode} detail`}
            className="max-h-[280px] rounded-lg border shadow-sm"
          />
          <div className="absolute -top-2 -right-2 rounded-full bg-amber-100 p-1.5">
            <Box className="h-4 w-4 text-amber-600" />
          </div>
        </div>
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-slate-100">
          <Box className="h-16 w-16 text-slate-300" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-700">3D model unavailable</p>
        <p className="text-xs text-slate-500">
          {errorMessage || 'Could not load the 3D model for this detail'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RotateCcw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

export function Model3DViewer({
  modelUrl,
  detailCode,
  thumbnailUrl,
  activeStep = 1,
  stageMetadata,
  onStepChange,
  onLoad,
  onError,
}: Model3DViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [key, setKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [internalStep, setInternalStep] = useState(activeStep);
  const [modelTransform, setModelTransform] = useState<ModelTransform | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  // Sync internal step with prop
  useEffect(() => {
    setInternalStep(activeStep);
  }, [activeStep]);

  const hasStepSync = !!stageMetadata && stageMetadata.stages.length > 0;
  const totalSteps = stageMetadata?.stages.length || 1;

  // Get current stage labels for instruction panel and 3D labels
  const currentLabels = useMemo(() => {
    if (!stageMetadata) return undefined;
    const stage = stageMetadata.stages.find(s => s.number === internalStep);
    return stage?.labels;
  }, [stageMetadata, internalStep]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDoubleTap = useCallback(() => {
    const resetFn = (window as unknown as { resetCamera?: () => void }).resetCamera;
    if (resetFn) resetFn();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      handleDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [handleDoubleTap]);

  const handleReset = useCallback(() => {
    const resetFn = (window as unknown as { resetCamera?: () => void }).resetCamera;
    if (resetFn) resetFn();
  }, []);

  const handleError = (error: Error) => {
    console.error('3D Model Error:', error);
    setHasError(true);
    setErrorMessage(error.message);
    onError?.(error);
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage(undefined);
    setModelTransform(null);
    setKey(k => k + 1);
  };

  const handleStepChange = useCallback((step: number) => {
    setInternalStep(step);
    onStepChange?.(step);
  }, [onStepChange]);

  const handleModelReady = useCallback((transform: ModelTransform) => {
    setModelTransform(transform);
  }, []);

  const hasModel = !!modelUrl;

  if (hasError) {
    return (
      <div className="relative h-[400px] w-full rounded-lg border bg-slate-900 overflow-hidden">
        <Fallback2D
          detailCode={detailCode}
          thumbnailUrl={thumbnailUrl}
          onRetry={handleRetry}
          errorMessage={errorMessage}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-lg border border-slate-800 bg-black overflow-hidden"
    >
      {/* 3D Canvas */}
      <div
        className="relative h-[320px] touch-none"
        onTouchEnd={handleTouchEnd}
      >
        <Model3DErrorBoundary
          onError={handleError}
          fallback={
            <Fallback2D
              detailCode={detailCode}
              thumbnailUrl={thumbnailUrl}
              onRetry={handleRetry}
            />
          }
        >
          <Canvas
            key={key}
            camera={{ position: [3, 3, 3], fov: 40 }}
            gl={{
              toneMappingExposure: 1.0,
              toneMapping: THREE.NoToneMapping // V3D colors are already in display space (sRGB)
            }}
            onCreated={({ scene }) => {
              // Black background — matches Verge3D world material
              scene.background = new THREE.Color('#000000');
              if (!hasModel) onLoad?.();
            }}
          >
            {/* Lighting balanced for V3D-colored materials on black background */}
            <ambientLight intensity={0.6} /> {/* Base illumination so dark V3D colors stay visible */}
            <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow /> {/* Main key light - reduced from 1.2 to avoid washing out V3D colors */}
            <directionalLight position={[-3, 2, -3]} intensity={0.5} /> {/* Fill light - prevents hard shadows on back faces */}

            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1.5}
              maxDistance={15}
              minPolarAngle={0.1}
              maxPolarAngle={Math.PI / 2}
              target={[0, 1, 0]}
              touches={{
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN,
              }}
              enableDamping={true}
              dampingFactor={0.05}
            />

            <CameraController controlsRef={controlsRef} onReset={handleReset} />

            {/* Camera animation for step-synced models */}
            {hasStepSync && modelTransform && stageMetadata && (
              <CameraAnimator
                controlsRef={controlsRef}
                activeStep={internalStep}
                stageMetadata={stageMetadata}
                modelScale={modelTransform.scale}
                modelCenter={modelTransform.center}
              />
            )}

            {/* Environment in its own Suspense to avoid blocking scene */}
            <Suspense fallback={null}>
              <Environment preset="city" background={false} />
            </Suspense>

            {/* Model loading */}
            <Suspense fallback={<LoadingSpinner />}>
              {hasModel ? (
                hasStepSync ? (
                  <GLBModelWithSteps
                    url={modelUrl}
                    activeStep={internalStep}
                    stageMetadata={stageMetadata}
                    onLoad={onLoad}
                    onModelReady={handleModelReady}
                  />
                ) : (
                  <ModelLoader url={modelUrl} onLoad={onLoad} />
                )
              ) : (
                <PlaceholderBox detailCode={detailCode} />
              )}
            </Suspense>

            {/* 3D floating label markers — only for stages 2+ with a loaded model transform */}
            {hasStepSync && modelTransform && internalStep > 1 && currentLabels && (
              <StageLabels
                labels={currentLabels}
                modelScale={modelTransform.scale}
                modelCenter={modelTransform.center}
              />
            )}
          </Canvas>
        </Model3DErrorBoundary>

        {/* Reset view button — overlaid on canvas */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="absolute bottom-2 right-2 h-8 gap-1.5 bg-black/50 backdrop-blur hover:bg-black/70 text-white border-white/20 text-xs"
          aria-label="Reset view"
          title={isMobile ? 'Double-tap to reset' : 'Drag to rotate, scroll to zoom, shift+drag to pan'}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>

        {/* Preview Model badge — only when no real model */}
        {!hasModel && (
          <div className="absolute top-3 right-3 rounded-md bg-amber-500/20 px-2 py-1 text-xs text-amber-300">
            Preview Model
          </div>
        )}
      </div>

      {/* Instruction panel — between canvas and step bar */}
      {hasStepSync && (
        <InstructionPanel labels={currentLabels} />
      )}

      {/* Step navigation bar */}
      {hasStepSync && (
        <StepBar
          totalStages={totalSteps}
          activeStep={internalStep}
          onStepChange={handleStepChange}
        />
      )}
    </div>
  );
}

// Preload models for better performance
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
