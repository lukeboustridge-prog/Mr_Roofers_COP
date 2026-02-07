'use client';

import { Suspense, useRef, useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Grid, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AlertTriangle, RotateCcw, Box, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Initial scene setup
  useEffect(() => {
    if (scene && groupRef.current) {
      const clonedScene = scene.clone(true);
      clonedSceneRef.current = clonedScene;

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

  // Apply layer visibility based on active step
  useEffect(() => {
    if (!clonedSceneRef.current || !stageMetadata) return;

    const currentStage = stageMetadata.stages.find(s => s.number === activeStep);
    if (!currentStage) return;

    for (const action of currentStage.actions) {
      const layerChanges = parseLayerAction(action.layers);

      for (const { layerName, visible } of layerChanges) {
        clonedSceneRef.current.traverse((child) => {
          if (child.name && child.name.includes(layerName)) {
            child.visible = visible;
          }
        });
      }
    }
  }, [activeStep, stageMetadata]);

  return <group ref={groupRef} />;
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
  const targetPosition = useRef(new THREE.Vector3(6, 4, 6));
  const targetLookAt = useRef(new THREE.Vector3(0, 1, 0));
  const isAnimating = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!controlsRef.current) return;

    // Skip animation on initial mount - keep the default centered view
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentStage = stageMetadata.stages.find(s => s.number === activeStep);
    if (!currentStage?.camera) return;

    // Transform native-space camera coordinates to scene coordinates
    // Model transform: scenePosAxis = (nativePos - center) * scale, with y += 1 for grid offset
    targetPosition.current.set(
      (currentStage.camera.position[0] - modelCenter.x) * modelScale,
      (currentStage.camera.position[1] - modelCenter.y) * modelScale + 1,
      (currentStage.camera.position[2] - modelCenter.z) * modelScale
    );

    targetLookAt.current.set(
      (currentStage.camera.target[0] - modelCenter.x) * modelScale,
      (currentStage.camera.target[1] - modelCenter.y) * modelScale + 1,
      (currentStage.camera.target[2] - modelCenter.z) * modelScale
    );

    isAnimating.current = true;
  }, [activeStep, stageMetadata, modelScale, modelCenter, controlsRef]);

  useFrame(() => {
    if (!isAnimating.current || !controlsRef.current) return;

    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition.current, 0.05);
    controlsRef.current.target.lerp(targetLookAt.current, 0.05);
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
      <Text position={[0, 2.5, 0]} fontSize={0.4} color="#1e3a5f" anchorX="center" anchorY="middle">
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
      <meshBasicMaterial color="#1e3a5f" wireframe />
    </mesh>
  );
}

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(6, 4, 6);
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
            <AlertTriangle className="h-4 w-4 text-amber-600" />
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

  const handlePrevStep = () => {
    if (internalStep > 1) {
      const newStep = internalStep - 1;
      setInternalStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const handleNextStep = () => {
    if (internalStep < totalSteps) {
      const newStep = internalStep + 1;
      setInternalStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const handleModelReady = useCallback((transform: ModelTransform) => {
    setModelTransform(transform);
  }, []);

  const hasModel = !!modelUrl;

  if (hasError) {
    return (
      <div className="relative h-[400px] w-full rounded-lg border bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden">
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
      className="relative h-[400px] w-full rounded-lg border bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden touch-none"
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
          camera={{ position: [6, 4, 6], fov: 40 }}
          onCreated={() => {
            if (!hasModel) onLoad?.();
          }}
        >
          {/* Lights and grid always visible - outside model Suspense */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />

          <Grid
            position={[0, 0, 0]}
            args={[10, 10]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#cbd5e1"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#94a3b8"
            fadeDistance={10}
            fadeStrength={1}
            followCamera={false}
          />

          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={25}
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

          {/* Animate camera for step-synced models once model transform is known */}
          {hasStepSync && modelTransform && (
            <CameraAnimator
              controlsRef={controlsRef}
              activeStep={internalStep}
              stageMetadata={stageMetadata!}
              modelScale={modelTransform.scale}
              modelCenter={modelTransform.center}
            />
          )}

          {/* Environment in its own Suspense to avoid blocking scene */}
          <Suspense fallback={null}>
            <Environment preset="city" />
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
        </Canvas>
      </Model3DErrorBoundary>

      {/* Step navigation for synced models */}
      {hasStepSync && (
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevStep}
            disabled={internalStep <= 1}
            className="h-8 w-8 p-0 bg-white/90 backdrop-blur"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium backdrop-blur">
            Stage {internalStep} / {totalSteps}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextStep}
            disabled={internalStep >= totalSteps}
            className="h-8 w-8 p-0 bg-white/90 backdrop-blur"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-3 left-3 rounded-md bg-white/80 px-2 py-1 text-xs text-slate-500 backdrop-blur">
        {isMobile ? (
          'Drag to rotate • Pinch to zoom • Double-tap to reset'
        ) : (
          'Drag to rotate • Scroll to zoom • Shift+drag to pan'
        )}
      </div>

      {/* Reset view button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="absolute bottom-3 right-3 h-9 gap-1.5 bg-white/80 backdrop-blur hover:bg-white"
        aria-label="Reset view"
      >
        <Maximize2 className="h-4 w-4" />
        <span className="hidden sm:inline">Reset</span>
      </Button>

      {/* Model status indicator */}
      {!hasModel && (
        <div className="absolute top-3 right-3 rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-700">
          Preview Model
        </div>
      )}
      {hasModel && !hasStepSync && (
        <div className="absolute top-3 right-3 rounded-md bg-green-100 px-2 py-1 text-xs text-green-700">
          3D Model
        </div>
      )}
      {hasModel && hasStepSync && (
        <div className="absolute top-3 right-3 rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700">
          Interactive 3D
        </div>
      )}
    </div>
  );
}

// Preload models for better performance
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
