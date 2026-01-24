'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface Model3DViewerProps {
  modelUrl?: string | null;
  detailCode: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
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
        font="/fonts/Inter-Bold.woff"
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

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#e2e8f0" wireframe />
    </mesh>
  );
}

export function Model3DViewer({
  modelUrl,
  detailCode,
  onLoad,
}: Model3DViewerProps) {
  // For now, always show placeholder. Real model loading will be added later.
  const showPlaceholder = !modelUrl;

  return (
    <div className="relative h-[400px] w-full rounded-lg border bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden">
      <Canvas
        camera={{ position: [4, 3, 4], fov: 45 }}
        onCreated={() => onLoad?.()}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />

          {/* Content */}
          {showPlaceholder ? (
            <PlaceholderBox detailCode={detailCode} />
          ) : (
            // Future: Load actual model here
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
            minDistance={2}
            maxDistance={15}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2}
          />

          {/* Environment for reflections */}
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* Controls hint */}
      <div className="absolute bottom-3 left-3 rounded-md bg-white/80 px-2 py-1 text-xs text-slate-500 backdrop-blur">
        Drag to rotate • Scroll to zoom • Shift+drag to pan
      </div>

      {/* Placeholder indicator */}
      {showPlaceholder && (
        <div className="absolute top-3 right-3 rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-700">
          Preview Model
        </div>
      )}
    </div>
  );
}
