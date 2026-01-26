'use client';

import { Suspense, useRef, useState, useEffect, Component, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid, Environment, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { AlertTriangle, RotateCcw, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Model3DViewerProps {
  modelUrl?: string | null;
  detailCode: string;
  thumbnailUrl?: string | null;
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

// Component to load actual GLB model
function GLBModel({ url, onLoad }: { url: string; onLoad?: () => void }) {
  const { scene } = useGLTF(url, true, true, (loader) => {
    loader.setCrossOrigin('anonymous');
  });
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene && groupRef.current) {
      // Clone the scene to avoid mutation issues
      const clonedScene = scene.clone();

      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(clonedScene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Scale to fit in a 2-unit box
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      clonedScene.scale.setScalar(scale);

      // Center the model
      clonedScene.position.x = -center.x * scale;
      clonedScene.position.y = -center.y * scale + 1; // Lift slightly above grid
      clonedScene.position.z = -center.z * scale;

      // Clear previous children and add new
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      groupRef.current.add(clonedScene);

      onLoad?.();
    }
  }, [scene, onLoad]);

  return <group ref={groupRef} />;
}

// Wrapper to handle loading
function ModelLoader({ url, onLoad }: {
  url: string;
  onLoad?: () => void;
}) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Center>
        <GLBModel url={url} onLoad={onLoad} />
      </Center>
    </Suspense>
  );
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
      {/* Main box representing a roof detail */}
      <mesh ref={meshRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[2, 0.1, 3]} />
        <meshStandardMaterial
          color="#4a5568"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Wall section */}
      <mesh position={[0, 1, -1.5]}>
        <boxGeometry args={[2, 2, 0.15]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      {/* Flashing detail */}
      <mesh position={[0, 0.6, -1.35]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[2.1, 0.02, 0.3]} />
        <meshStandardMaterial
          color="#f97316"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Detail code label */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.4}
        color="#1e3a5f"
        anchorX="center"
        anchorY="middle"
      >
        {detailCode}
      </Text>

      <Text
        position={[0, 2.1, 0]}
        fontSize={0.15}
        color="#64748b"
        anchorX="center"
        anchorY="middle"
      >
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

// 2D Fallback component when 3D fails completely
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
        <p className="text-sm font-medium text-slate-700">
          3D model unavailable
        </p>
        <p className="text-xs text-slate-500">
          {errorMessage || 'Could not load the 3D model for this detail'}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="gap-2"
      >
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
  onLoad,
  onError,
}: Model3DViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [key, setKey] = useState(0); // Used to force remount on retry

  const handleError = (error: Error) => {
    console.error('3D Model Error:', error);
    setHasError(true);
    setErrorMessage(error.message);
    onError?.(error);
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage(undefined);
    setKey(k => k + 1);
  };

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
    <div className="relative h-[400px] w-full rounded-lg border bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden">
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
          <Suspense fallback={<LoadingSpinner />}>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
            <directionalLight position={[-5, 3, -5]} intensity={0.3} />

            {/* Content */}
            {hasModel ? (
              <ModelLoader url={modelUrl} onLoad={onLoad} />
            ) : (
              <PlaceholderBox detailCode={detailCode} />
            )}

            {/* Grid for reference */}
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

            {/* Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={3}
              maxDistance={25}
              minPolarAngle={0.1}
              maxPolarAngle={Math.PI / 2}
              target={[0, 1, 0]}
            />

            {/* Environment for reflections */}
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </Model3DErrorBoundary>

      {/* Controls hint */}
      <div className="absolute bottom-3 left-3 rounded-md bg-white/80 px-2 py-1 text-xs text-slate-500 backdrop-blur">
        Drag to rotate • Scroll to zoom • Shift+drag to pan
      </div>

      {/* Model status indicator */}
      {!hasModel && (
        <div className="absolute top-3 right-3 rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-700">
          Preview Model
        </div>
      )}
      {hasModel && (
        <div className="absolute top-3 right-3 rounded-md bg-green-100 px-2 py-1 text-xs text-green-700">
          3D Model
        </div>
      )}
    </div>
  );
}

// Preload models for better performance
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
