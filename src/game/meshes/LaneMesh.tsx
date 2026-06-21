import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LaneMeshProps {
  laneIndex: number;
  laneType: "safe" | "road" | "water";
  laneWidth: number;
}

const ROAD_COLORS = {
  safe: "#1a3a1a",
  road: "#1a1a2a",
  water: "#0a1a3a",
};

const STRIPE_COLORS = {
  safe: "#2a5a2a",
  road: "#333355",
  water: "#0a2a5a",
};

export function LaneMesh({ laneIndex, laneType, laneWidth }: LaneMeshProps) {
  const stripeRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (laneType === "water" && stripeRef.current) {
      stripeRef.current.position.x =
        ((stripeRef.current.position.x + delta * 2) % 30) - 15;
    }
  });

  const z = -laneIndex * laneWidth;

  return (
    <group position={[0, 0, z]}>
      {/* Base lane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, laneWidth]} />
        <meshStandardMaterial
          color={ROAD_COLORS[laneType]}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Lane markings */}
      {laneType === "road" && (
        <mesh
          ref={stripeRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
        >
          <planeGeometry args={[30, 0.08]} />
          <meshStandardMaterial
            color="#ffcc00"
            emissive="#ffaa00"
            emissiveIntensity={0.3}
            roughness={0.5}
          />
        </mesh>
      )}

      {laneType === "safe" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[30, laneWidth * 0.9]} />
          <meshStandardMaterial
            color={STRIPE_COLORS[laneType]}
            roughness={0.9}
          />
        </mesh>
      )}

      {laneType === "water" && (
        <>
          <mesh
            ref={stripeRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.02, 0]}
          >
            <planeGeometry args={[30, 0.15]} />
            <meshStandardMaterial
              color="#00aaff"
              emissive="#0055ff"
              emissiveIntensity={0.4}
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* Water shimmer */}
          <pointLight
            position={[0, 0.5, 0]}
            color="#0088ff"
            intensity={0.3}
            distance={8}
          />
        </>
      )}

      {/* Edge highlight */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, laneWidth / 2 - 0.05]}
      >
        <planeGeometry args={[30, 0.1]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.05}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}
