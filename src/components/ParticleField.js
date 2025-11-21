'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleCloud() {
  const points = useRef();
  const particleCount = 5000;

  // Generate particle positions
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Create depth-based distribution
      const radius = Math.random() * 20 + 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) - 10;
      positions[i3 + 2] = radius * Math.cos(phi);
    }

    return positions;
  }, []);

  // Animate particles
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (points.current) {
      points.current.rotation.y = time * 0.05;
      points.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    }
  });

  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#FF4D00"
        size={0.1}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  );
}

function GridPlane() {
  const gridRef = useRef();

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = ((state.clock.getElapsedTime() * 2) % 20) - 10;
    }
  });

  return (
    <group position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[...Array(5)].map((_, i) => (
        <gridHelper
          key={i}
          ref={i === 0 ? gridRef : null}
          args={[50, 50, '#00F3FF', '#00F3FF']}
          position={[0, 0, i * 20 - 10]}
          material-opacity={0.2}
          material-transparent
        />
      ))}
    </group>
  );
}

function CyanParticles() {
  const points = useRef();
  const particleCount = 2000;

  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 30;
      positions[i3 + 1] = (Math.random() - 0.5) * 30;
      positions[i3 + 2] = (Math.random() - 0.5) * 30;
    }

    return positions;
  }, []);

  useFrame((state) => {
    if (points.current) {
      const time = state.clock.getElapsedTime();
      points.current.rotation.y = time * 0.03;
    }
  });

  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00F3FF"
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.4}
      />
    </Points>
  );
}

export default function ParticleField() {
  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ background: '#050505' }}
      >
        <ambientLight intensity={0.5} />
        <ParticleCloud />
        <CyanParticles />
        <GridPlane />
      </Canvas>
    </div>
  );
}
