'use client';

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ChickenMeshProps {
  position: [number, number, number];
  isMoving: boolean;
  isDead: boolean;
}

export function ChickenMesh({ position, isMoving, isDead }: ChickenMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const wingLRef = useRef<THREE.Mesh>(null);
  const wingRRef = useRef<THREE.Mesh>(null);
  const legLRef = useRef<THREE.Mesh>(null);
  const legRRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isDead) {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        Math.PI / 2,
        delta * 5
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        0.1,
        delta * 3
      );
      return;
    }

    const t = Date.now() * 0.005;

    if (isMoving) {
      if (bodyRef.current) bodyRef.current.position.y = Math.abs(Math.sin(t * 8)) * 0.15;
      if (wingLRef.current) wingLRef.current.rotation.z = Math.sin(t * 8) * 0.4;
      if (wingRRef.current) wingRRef.current.rotation.z = -Math.sin(t * 8) * 0.4;
      if (legLRef.current) legLRef.current.rotation.x = Math.sin(t * 8) * 0.5;
      if (legRRef.current) legRRef.current.rotation.x = -Math.sin(t * 8) * 0.5;
    } else {
      if (bodyRef.current) bodyRef.current.position.y = Math.sin(t * 2) * 0.03;
      if (wingLRef.current) wingLRef.current.rotation.z = 0.1;
      if (wingRRef.current) wingRRef.current.rotation.z = -0.1;
    }

    // Glow effect on leading position
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh ref={bodyRef} castShadow>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial
          color="#f5c842"
          roughness={0.3}
          metalness={0.1}
          emissive="#f5a000"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.45, 0.2]} castShadow>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#f5c842" roughness={0.3} />
      </mesh>

      {/* Beak */}
      <mesh position={[0, 0.42, 0.4]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.06, 0.14, 6]} />
        <meshStandardMaterial color="#ff9900" />
      </mesh>

      {/* Comb */}
      <mesh position={[0, 0.68, 0.15]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.1, 0.5, 0.36]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-0.1, 0.5, 0.36]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Wings */}
      <mesh ref={wingLRef} position={[0.38, 0, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.08, 0.3, 0.25]} />
        <meshStandardMaterial color="#e8b800" />
      </mesh>
      <mesh ref={wingRRef} position={[-0.38, 0, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.08, 0.3, 0.25]} />
        <meshStandardMaterial color="#e8b800" roughness={0.4} />
      </mesh>

      {/* Left wing proper */}
      <mesh position={[0.38, 0, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.08, 0.3, 0.28]} />
        <meshStandardMaterial color="#e8b800" roughness={0.4} />
      </mesh>

      {/* Legs */}
      <mesh ref={legLRef} position={[0.12, -0.35, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.25, 6]} />
        <meshStandardMaterial color="#ff9900" />
      </mesh>
      <mesh ref={legRRef} position={[-0.12, -0.35, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.25, 6]} />
        <meshStandardMaterial color="#ff9900" />
      </mesh>

      {/* Point light for glow */}
      <pointLight color="#ffcc00" intensity={0.5} distance={3} />
    </group>
  );
}
