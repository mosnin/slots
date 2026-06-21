import * as THREE from "three";

interface TreeMeshProps {
  position: [number, number, number];
}

export function TreeMesh({ position }: TreeMeshProps) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.6, 6]} />
        <meshStandardMaterial color="#4a2800" roughness={0.9} />
      </mesh>
      {/* Foliage layers */}
      <mesh castShadow position={[0, 0.9, 0]}>
        <coneGeometry args={[0.5, 0.8, 7]} />
        <meshStandardMaterial
          color="#1a5c1a"
          roughness={0.8}
          emissive="#002200"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh castShadow position={[0, 1.3, 0]}>
        <coneGeometry args={[0.35, 0.7, 7]} />
        <meshStandardMaterial
          color="#228822"
          roughness={0.8}
          emissive="#003300"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh castShadow position={[0, 1.7, 0]}>
        <coneGeometry args={[0.2, 0.5, 7]} />
        <meshStandardMaterial
          color="#33aa33"
          roughness={0.8}
          emissive="#004400"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}
