'use client';

import { Suspense, useRef, useState, useEffect, useCallback, useMemo, Component, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Grid, Environment, useGLTF, Html } from '@react-three/drei';
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
  const { scene } = useGLTF(url, true, true, (loader) => {
    loader.setCrossOrigin('anonymous');
  });
  const groupRef = useRef<THREE.Group>(null);
  const clonedSceneRef = useRef<THREE.Group | null>(null);

  // Use refs for callbacks to avoid re-triggering the scene setup effect
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
  const onModelReadyRef = useRef(onModelReady);
  onModelReadyRef.current = onModelReady;

  // Initial scene setup — clone scene, clone materials, compute transform
  useEffect(() => {
    if (scene && groupRef.current) {
      const clonedScene = scene.clone(true);
      clonedSceneRef.current = clonedScene;

      // Clone each mesh's material individually (scene.clone shares materials by reference)
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => {
              const cloned = m.clone();
              originalOpacityMap.set(cloned, cloned.opacity);
              return cloned;
            });
          } else {
            mesh.material = mesh.material.clone();
            originalOpacityMap.set(mesh.material, mesh.material.opacity);
          }
        }
      });

      const box = new THREE.Box3().setFromObject(clonedScene);
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
  }, [scene]);

  // Apply cumulative layer visibility + ghost/highlight transparency
  useEffect(() => {
    if (!clonedSceneRef.current || !stageMetadata) return;

    // Helper to set material opacity on a mesh
    const setMeshOpacity = (mesh: THREE.Mesh, opacity: number) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (opacity < 1.0) {
          mat.transparent = true;
          mat.opacity = opacity;
          mat.depthWrite = opacity > 0.1; // Keep depth write for ghosted, disable for invisible
        } else {
          const origOpacity = originalOpacityMap.get(mat) ?? 1.0;
          mat.transparent = origOpacity < 1.0;
          mat.opacity = origOpacity;
          mat.depthWrite = true;
        }
        mat.needsUpdate = true;
      }
    };

    // Step 1: Reset ALL meshes to full opacity and visible
    clonedSceneRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.visible = true;
        setMeshOpacity(mesh, 1.0);
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
      clonedSceneRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.visible) {
          setMeshOpacity(child as THREE.Mesh, 0.25);
        }
      });

      // Second pass: highlight current stage's revealed components at full opacity
      const revealedArray = Array.from(currentRevealedLayers);
      clonedSceneRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.visible) {
          for (let r = 0; r < revealedArray.length; r++) {
            if (child.name && child.name.includes(revealedArray[r])) {
              setMeshOpacity(child as THREE.Mesh, 1.0);
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

// Animate camera to stage-defined positions using the model's coordinate transform
function CameraAnimator({
  controlsRef,
  activeStep,
  stageMetadata,
  modelScale,
  modelCenter,
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

    // Skip animation on initial mount — keep the default centered view
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip stage 1 (overview) — use default camera position
    if (activeStep <= 1) {
      targetPosition.current.set(3, 3, 3);
      targetLookAt.current.set(0, 1, 0);
      isAnimating.current = true;
      return;
    }

    const currentStage = stageMetadata.stages.find(s => s.number === activeStep);
    if (!currentStage?.camera) return;

    // Transform native-space camera coordinates to scene coordinates
    const newPos = new THREE.Vector3(
      (currentStage.camera.position[0] - modelCenter.x) * modelScale,
      (currentStage.camera.position[1] - modelCenter.y) * modelScale + 1,
      (currentStage.camera.position[2] - modelCenter.z) * modelScale
    );

    const newTarget = new THREE.Vector3(
      (currentStage.camera.target[0] - modelCenter.x) * modelScale,
      (currentStage.camera.target[1] - modelCenter.y) * modelScale + 1,
      (currentStage.camera.target[2] - modelCenter.z) * modelScale
    );

    // Distance clamp — skip animation if camera would fly too far from the model center
    const modelCenterScene = new THREE.Vector3(0, 1, 0);
    if (newPos.distanceTo(modelCenterScene) > 6) return;

    targetPosition.current.copy(newPos);
    targetLookAt.current.copy(newTarget);
    isAnimating.current = true;
  }, [activeStep, stageMetadata, modelScale, modelCenter, controlsRef]);

  useFrame(() => {
    if (!isAnimating.current || !controlsRef.current) return;

    // Smoothly interpolate camera position (0.06 for smooth cinematic transitions)
    camera.position.lerp(targetPosition.current, 0.06);
    controlsRef.current.target.lerp(targetLookAt.current, 0.06);
    controlsRef.current.update();

    // Check if animation is complete
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
  const { scene } = useGLTF(url, true, true, (loader) => {
    loader.setCrossOrigin('anonymous');
  });
  const groupRef = useRef<THREE.Group>(null);

  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  useEffect(() => {
    if (scene && groupRef.current) {
      const clonedScene = scene.clone();
      const box = new THREE.Box3().setFromObject(clonedScene);
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
  }, [scene]);

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
    <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-t border-[#095563]/10 overflow-x-auto">
      {/* Overview button (stage 1) */}
      <button
        onClick={() => onStepChange(1)}
        className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
          activeStep === 1
            ? 'bg-[#095563] text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                ? 'bg-[#095563] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
            ? 'bg-green-100 text-green-700'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
    <div className="px-3 py-2.5 bg-slate-50/90 border-t max-h-[80px] overflow-y-auto">
      <div className="space-y-1">
        {textLabels.map((label, idx) => (
          <p key={idx} className="text-xs leading-relaxed text-slate-700">
            {label.marker && label.marker.trim() !== '' ? (
              <>
                <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-[#095563] text-white text-[10px] font-bold mr-1.5 align-middle uppercase">
                  {label.marker.toUpperCase()}
                </span>
                {label.text}
              </>
            ) : (
              <span className="text-slate-500 italic">{label.text}</span>
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
      <div className="relative h-[400px] w-full rounded-lg border bg-gradient-to-b from-white to-slate-50 overflow-hidden">
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
      className="relative w-full rounded-lg border bg-gradient-to-b from-white to-slate-50 overflow-hidden"
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
            camera={{ position: [3, 3, 3], fov: 26 }}
            onCreated={() => {
              if (!hasModel) onLoad?.();
            }}
          >
            {/* Lights optimised for metallic roofing materials */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
            <directionalLight position={[-5, 3, -5]} intensity={0.4} />
            <directionalLight position={[0, 8, 0]} intensity={0.3} />

            <Grid
              position={[0, 0, 0]}
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#e2e8f0"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#cbd5e1"
              fadeDistance={10}
              fadeStrength={1}
              followCamera={false}
            />

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
              <Environment preset="studio" />
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
          className="absolute bottom-2 right-2 h-8 gap-1.5 bg-white/80 backdrop-blur hover:bg-white text-xs"
          aria-label="Reset view"
          title={isMobile ? 'Double-tap to reset' : 'Drag to rotate, scroll to zoom, shift+drag to pan'}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>

        {/* Preview Model badge — only when no real model */}
        {!hasModel && (
          <div className="absolute top-3 right-3 rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-700">
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
