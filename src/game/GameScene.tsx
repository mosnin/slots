'use client';

import { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "../store/gameStore";
import { ChickenMesh } from "./meshes/ChickenMesh";
import { LaneMesh } from "./meshes/LaneMesh";
import { CarMesh } from "./meshes/CarMesh";
import { TreeMesh } from "./meshes/TreeMesh";
import { useMobileControls } from "./hooks/useMobileControls";
import { useKeyboardControls } from "./hooks/useKeyboardControls";

const LANE_COUNT = 20;
const LANE_WIDTH = 2.2;
const SAFE_LANE_INTERVAL = 4;

interface Car {
  id: number;
  lane: number;
  x: number;
  speed: number;
  direction: 1 | -1;
  color: string;
}

interface Lane {
  index: number;
  type: "safe" | "road" | "water";
  speed: number;
}

function generateLanes(): Lane[] {
  const lanes: Lane[] = [{ index: 0, type: "safe", speed: 0 }];
  for (let i = 1; i < LANE_COUNT; i++) {
    if (i % SAFE_LANE_INTERVAL === 0) {
      lanes.push({ index: i, type: "safe", speed: 0 });
    } else {
      const speed = 2 + (i / LANE_COUNT) * 6;
      lanes.push({ index: i, type: "road", speed });
    }
  }
  return lanes;
}

const LANES = generateLanes();
const CAR_COLORS = ["#FF4444", "#4444FF", "#FFFF44", "#FF44FF", "#44FFFF", "#FF8800"];

export function GameScene() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const incrementScore = useGameStore((s) => s.incrementScore);
  const incrementLane = useGameStore((s) => s.incrementLane);
  const score = useGameStore((s) => s.score);
  const lane = useGameStore((s) => s.lane);

  const [chickenPos, setChickenPos] = useState({ x: 0, z: 0 });
  const [chickenLane, setChickenLane] = useState(0);
  const [cars, setCars] = useState<Car[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const targetCameraY = useRef(5);
  const targetCameraZ = useRef(8);

  // Initialize cars
  useEffect(() => {
    const initialCars: Car[] = [];
    let id = 0;
    LANES.forEach((lane) => {
      if (lane.type === "road") {
        const carCount = 2 + Math.floor(Math.random() * 3);
        for (let c = 0; c < carCount; c++) {
          initialCars.push({
            id: id++,
            lane: lane.index,
            x: (Math.random() - 0.5) * 40,
            speed: lane.speed,
            direction: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
            color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
          });
        }
      }
    });
    setCars(initialCars);
  }, []);

  const move = useCallback(
    (dir: "up" | "down" | "left" | "right") => {
      if (phase !== "playing" || isMoving) return;
      setIsMoving(true);
      setTimeout(() => setIsMoving(false), 200);

      setChickenPos((prev) => {
        let nx = prev.x;
        let nz = prev.z;
        let nl = chickenLane;

        if (dir === "up") {
          nz -= LANE_WIDTH;
          nl = chickenLane + 1;
        } else if (dir === "down") {
          nz += LANE_WIDTH;
          nl = Math.max(0, chickenLane - 1);
        } else if (dir === "left") {
          nx -= 1.5;
        } else if (dir === "right") {
          nx += 1.5;
        }

        nx = Math.max(-10, Math.min(10, nx));

        if (dir === "up" && nl > chickenLane) {
          setChickenLane(nl);
          incrementScore();
          incrementLane();
          targetCameraY.current = 5 + nl * 0.2;
          targetCameraZ.current = 8 + nl * 0.5;
        } else if (dir === "down") {
          setChickenLane(nl);
        }

        return { x: nx, z: nz };
      });
    },
    [phase, isMoving, chickenLane, incrementScore, incrementLane]
  );

  useKeyboardControls(move);
  useMobileControls(move);

  // Move cars and check collisions
  useFrame((_, delta) => {
    if (phase !== "playing") return;

    setCars((prev) =>
      prev.map((car) => {
        let nx = car.x + car.speed * car.direction * delta;
        if (nx > 25) nx = -25;
        if (nx < -25) nx = 25;
        return { ...car, x: nx };
      })
    );

    // Collision detection
    const chickenWorldX = chickenPos.x;
    const chickenWorldZ = chickenPos.z;

    for (const car of cars) {
      if (car.lane !== chickenLane) continue;
      const dx = Math.abs(car.x - chickenWorldX);
      const dz = Math.abs(car.lane * LANE_WIDTH * -1 - chickenWorldZ + 0); // approx
      if (dx < 1.2 && dz < 0.8) {
        setPhase("dead");
        break;
      }
    }

    // Smooth camera follow
    if (cameraRef.current) {
      const targetZ = chickenWorldZ + targetCameraZ.current;
      const targetY = targetCameraY.current + chickenLane * 0.1;
      cameraRef.current.position.z +=
        (targetZ - cameraRef.current.position.z) * 0.08;
      cameraRef.current.position.y +=
        (targetY - cameraRef.current.position.y) * 0.08;
      cameraRef.current.lookAt(
        new THREE.Vector3(0, 0, chickenWorldZ - 2)
      );
    }
  });

  const startGame = () => {
    setChickenPos({ x: 0, z: 0 });
    setChickenLane(0);
    setCars((prev) =>
      prev.map((car) => ({
        ...car,
        x: (Math.random() - 0.5) * 40,
      }))
    );
    setPhase("playing");
  };

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={60}
        position={[0, 5, 8]}
        near={0.1}
        far={200}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} color="#4040ff" />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        color="#fff5e0"
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ff6040" />

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.5} fade />
      <fog attach="fog" args={["#0a0a1a", 20, 60]} />

      {/* Ground lanes */}
      {LANES.map((laneData) => (
        <LaneMesh
          key={laneData.index}
          laneIndex={laneData.index}
          laneType={laneData.type}
          laneWidth={LANE_WIDTH}
        />
      ))}

      {/* Cars */}
      {cars.map((car) => (
        <CarMesh
          key={car.id}
          position={[car.x, 0.35, -car.lane * LANE_WIDTH]}
          color={car.color}
          direction={car.direction}
        />
      ))}

      {/* Decorative trees on safe lanes */}
      {LANES.filter((l) => l.type === "safe").map((laneData) =>
        [-12, -8, 8, 12].map((tx) => (
          <TreeMesh
            key={`tree-${laneData.index}-${tx}`}
            position={[tx, 0, -laneData.index * LANE_WIDTH]}
          />
        ))
      )}

      {/* Chicken */}
      <ChickenMesh
        position={[chickenPos.x, 0.4, chickenPos.z]}
        isMoving={isMoving}
        isDead={phase === "dead"}
      />

      {/* Click to start overlay (invisible plane) */}
      {phase === "idle" && (
        <mesh
          position={[0, 0.1, 4]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={startGame}
        >
          <planeGeometry args={[30, 10]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </>
  );
}
