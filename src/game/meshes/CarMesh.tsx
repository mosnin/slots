'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CarMeshProps {
  position: [number, number, number];
  color: string;
  direction: 1 | -1;
  type?: 'car' | 'truck' | 'bus';
}

export function CarMesh({ position, color, direction, type = 'car' }: CarMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      groupRef.current.rotation.y = direction === 1 ? 0 : Math.PI;
    }
  });

  const length = type === 'bus' ? 2.2 : type === 'truck' ? 1.8 : 1.3;
  const height = type === 'bus' ? 0.7 : type === 'truck' ? 0.5 : 0.38;
  const width = 0.7;

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh castShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[length, height, width]} />
        <meshStandardMaterial color={color} roughness={0.15} metalness={0.9}
          emissive={color} emissiveIntensity={0.05} />
      </mesh>

      {/* Roof (cars/trucks only) */}
      {type !== 'bus' && (
        <mesh castShadow position={[0, height + 0.22, 0]}>
          <boxGeometry args={[length * 0.65, 0.3, width * 0.9]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
        </mesh>
      )}

      {/* Windshield */}
      <mesh position={[length * 0.38, height * 0.7, 0]}>
        <boxGeometry args={[0.05, height * 0.5, width * 0.85]} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.6} roughness={0.05} metalness={0.1} />
      </mesh>

      {/* Headlights */}
      {[-0.22, 0.22].map((z, i) => (
        <group key={i}>
          <mesh position={[length / 2, height * 0.4, z]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#ffffdd" emissive="#ffff88" emissiveIntensity={3} />
          </mesh>
          <pointLight position={[length / 2 + 0.3, height * 0.4, z]}
            color="#ffffcc" intensity={direction === 1 ? 3 : 0.5} distance={8} />
        </group>
      ))}

      {/* Taillights */}
      {[-0.22, 0.22].map((z, i) => (
        <mesh key={i} position={[-length / 2, height * 0.4, z]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
      ))}

      {/* Wheels */}
      {[length * 0.32, -length * 0.32].flatMap((lx) =>
        [width / 2 + 0.04, -(width / 2 + 0.04)].map((lz, j) => (
          <group key={`${lx}-${j}`} position={[lx, 0.18, lz]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.2, 0.2, 0.15, 12]} />
              <meshStandardMaterial color="#222" roughness={0.95} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.12, 0.12, 0.16, 6]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        ))
      )}

      {/* Exhaust */}
      <mesh position={[-length / 2 - 0.05, 0.25, width * 0.3]}>
        <cylinderGeometry args={[0.04, 0.03, 0.2, 6]} />
        <meshStandardMaterial color="#444" roughness={0.8} />
      </mesh>
    </group>
  );
}
