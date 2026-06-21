import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CarMeshProps {
  position: [number, number, number];
  color: string;
  direction: 1 | -1;
}

export function CarMesh({ position, color, direction }: CarMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      groupRef.current.rotation.y = direction === 1 ? 0 : Math.PI;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Car body */}
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[1.4, 0.4, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Car roof */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.65]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0.35, 0.48, 0]}>
        <boxGeometry args={[0.05, 0.25, 0.6]} />
        <meshStandardMaterial
          color="#aaddff"
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.72, 0.2, 0.25]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial
          color="#ffffaa"
          emissive="#ffff00"
          emissiveIntensity={1}
        />
      </mesh>
      <mesh position={[0.72, 0.2, -0.25]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial
          color="#ffffaa"
          emissive="#ffff00"
          emissiveIntensity={1}
        />
      </mesh>

      {/* Taillights */}
      <mesh position={[-0.72, 0.2, 0.25]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#ff0000"
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh position={[-0.72, 0.2, -0.25]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#ff0000"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Wheels */}
      {[
        [0.5, -0.05, 0.38] as [number, number, number],
        [-0.5, -0.05, 0.38] as [number, number, number],
        [0.5, -0.05, -0.38] as [number, number, number],
        [-0.5, -0.05, -0.38] as [number, number, number],
      ].map((wp, i) => (
        <mesh key={i} position={wp} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.15, 10]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      ))}

      {/* Headlight cone */}
      <pointLight
        position={[0.8, 0.3, 0]}
        color="#ffffcc"
        intensity={1.5}
        distance={6}
      />
    </group>
  );
}
