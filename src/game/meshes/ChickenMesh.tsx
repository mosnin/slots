'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ChickenMeshProps {
  position: [number, number, number];
  isMoving: boolean;
  isDead: boolean;
  direction?: 'up'|'down'|'left'|'right';
}

export function ChickenMesh({ position, isMoving, isDead, direction = 'up' }: ChickenMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Mesh>(null);
  const legRRef = useRef<THREE.Mesh>(null);
  const wingLRef = useRef<THREE.Mesh>(null);
  const wingRRef = useRef<THREE.Mesh>(null);
  const deathRot = useRef(0);
  const bounceRef = useRef(0);

  const targetRotY = { up: 0, down: Math.PI, left: -Math.PI/2, right: Math.PI/2 }[direction];

  useFrame((_, delta) => {
    if (!groupRef.current || !bodyRef.current) return;

    // Rotate toward direction
    const cur = groupRef.current.rotation.y;
    const diff = ((targetRotY - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    groupRef.current.rotation.y += diff * delta * 12;

    if (isDead) {
      deathRot.current = Math.min(deathRot.current + delta * 5, Math.PI / 2);
      groupRef.current.rotation.z = deathRot.current;
      groupRef.current.position.y = Math.max(-0.1, 0.4 - deathRot.current * 0.2);
      return;
    }

    groupRef.current.position.set(position[0], position[1], position[2]);

    const t = performance.now() * 0.001;

    if (isMoving) {
      bounceRef.current += delta * 20;
      const bounce = Math.abs(Math.sin(bounceRef.current)) * 0.25;
      bodyRef.current.position.y = bounce;
      if (legLRef.current) legLRef.current.rotation.x = Math.sin(bounceRef.current) * 0.7;
      if (legRRef.current) legRRef.current.rotation.x = -Math.sin(bounceRef.current) * 0.7;
      if (wingLRef.current) wingLRef.current.rotation.z = 0.3 + Math.sin(bounceRef.current) * 0.3;
      if (wingRRef.current) wingRRef.current.rotation.z = -0.3 - Math.sin(bounceRef.current) * 0.3;
    } else {
      bodyRef.current.position.y = Math.sin(t * 1.5) * 0.04;
      if (legLRef.current) legLRef.current.rotation.x = 0;
      if (legRRef.current) legRRef.current.rotation.x = 0;
      if (wingLRef.current) wingLRef.current.rotation.z = 0.15;
      if (wingRRef.current) wingRRef.current.rotation.z = -0.15;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <group ref={bodyRef}>
        {/* Main body */}
        <mesh castShadow>
          <sphereGeometry args={[0.38, 14, 12]} />
          <meshStandardMaterial color="#f5c842" roughness={0.4} metalness={0.05}
            emissive="#c89000" emissiveIntensity={0.08} />
        </mesh>

        {/* Tail feathers */}
        <mesh position={[0, 0.1, 0.32]} rotation={[0.6, 0, 0]}>
          <coneGeometry args={[0.12, 0.3, 5]} />
          <meshStandardMaterial color="#e8a800" roughness={0.5} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.48, -0.22]} castShadow>
          <sphereGeometry args={[0.24, 12, 10]} />
          <meshStandardMaterial color="#f5c842" roughness={0.3} />
        </mesh>

        {/* Beak upper */}
        <mesh position={[0, 0.43, -0.45]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.06, 0.16, 5]} />
          <meshStandardMaterial color="#ff9900" roughness={0.3} />
        </mesh>
        {/* Beak lower */}
        <mesh position={[0, 0.38, -0.44]} rotation={[0.5, 0, 0]}>
          <coneGeometry args={[0.05, 0.1, 5]} />
          <meshStandardMaterial color="#e67e00" roughness={0.3} />
        </mesh>

        {/* Comb */}
        {[0, 0.07, -0.07].map((ox, i) => (
          <mesh key={i} position={[ox, 0.73, -0.2]} castShadow>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#dd2200" emissive="#ff0000" emissiveIntensity={0.4} />
          </mesh>
        ))}

        {/* Wattle */}
        <mesh position={[0, 0.32, -0.42]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#cc1100" emissive="#ff0000" emissiveIntensity={0.3} />
        </mesh>

        {/* Eyes */}
        <mesh position={[0.11, 0.52, -0.4]}>
          <sphereGeometry args={[0.04, 7, 7]} />
          <meshStandardMaterial color="#111" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[-0.11, 0.52, -0.4]}>
          <sphereGeometry args={[0.04, 7, 7]} />
          <meshStandardMaterial color="#111" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>

        {/* Wings */}
        <mesh ref={wingLRef} position={[0.4, 0, 0.05]} rotation={[0, 0.2, 0.15]}>
          <boxGeometry args={[0.1, 0.32, 0.3]} />
          <meshStandardMaterial color="#e8b400" roughness={0.5} />
        </mesh>
        <mesh ref={wingRRef} position={[-0.4, 0, 0.05]} rotation={[0, -0.2, -0.15]}>
          <boxGeometry args={[0.1, 0.32, 0.3]} />
          <meshStandardMaterial color="#e8b400" roughness={0.5} />
        </mesh>
      </group>

      {/* Legs */}
      <mesh ref={legLRef} position={[0.13, -0.38, 0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.28, 6]} />
        <meshStandardMaterial color="#ff9900" roughness={0.4} />
      </mesh>
      <mesh ref={legRRef} position={[-0.13, -0.38, 0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.28, 6]} />
        <meshStandardMaterial color="#ff9900" roughness={0.4} />
      </mesh>

      {/* Feet */}
      {[0.13, -0.13].map((x, i) => (
        <mesh key={i} position={[x, -0.52, -0.06]}>
          <boxGeometry args={[0.15, 0.04, 0.2]} />
          <meshStandardMaterial color="#e67e00" roughness={0.4} />
        </mesh>
      ))}

      {/* Glow aura */}
      <pointLight color="#ffcc00" intensity={0.8} distance={4} />
    </group>
  );
}
