'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { ChickenMesh } from './meshes/ChickenMesh';
import { LaneMesh } from './meshes/LaneMesh';
import { CarMesh } from './meshes/CarMesh';
import { TreeMesh } from './meshes/TreeMesh';
import { useMobileControls } from './hooks/useMobileControls';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useSounds } from './sounds/useSounds';

const LANE_COUNT = 30;
const LANE_WIDTH = 2.4;
const SAFE_EVERY = 4;

interface Car {
  id: number;
  lane: number;
  x: number;
  speed: number;
  dir: 1 | -1;
  color: string;
  type: 'car' | 'truck' | 'bus';
}

function makeLanes() {
  const types: Array<'safe' | 'road'> = [];
  for (let i = 0; i < LANE_COUNT; i++) {
    types.push(i % SAFE_EVERY === 0 ? 'safe' : 'road');
  }
  return types;
}

const LANES = makeLanes();
const COLORS = ['#e74c3c','#3498db','#f1c40f','#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4'];

function makeCars(): Car[] {
  const cars: Car[] = [];
  let id = 0;
  LANES.forEach((t, i) => {
    if (t !== 'road') return;
    const count = 2 + Math.floor(Math.random() * 4);
    const baseSpeed = 2.5 + (i / LANE_COUNT) * 9;
    const dir = (i % 2 === 0 ? 1 : -1) as 1 | -1;
    const vTypes: Array<'car'|'truck'|'bus'> = ['car','car','car','truck','bus'];
    for (let c = 0; c < count; c++) {
      cars.push({
        id: id++,
        lane: i,
        x: ((c / count) - 0.5) * 50 + Math.random() * 5,
        speed: baseSpeed * (0.8 + Math.random() * 0.4),
        dir,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        type: vTypes[Math.floor(Math.random() * vTypes.length)],
      });
    }
  });
  return cars;
}

// Floating score popup
interface ScorePopup {
  id: number;
  x: number;
  z: number;
  value: number;
  age: number;
}

export function GameScene() {
  const phase = useGameStore(s => s.phase);
  const setPhase = useGameStore(s => s.setPhase);
  const incrementScore = useGameStore(s => s.incrementScore);
  const incrementDistance = useGameStore(s => s.incrementDistance);
  const score = useGameStore(s => s.score);

  const [chickenPos, setChickenPos] = useState({ x: 0, z: 0 });
  const [chickenLane, setChickenLane] = useState(0);
  const [chickenDir, setChickenDir] = useState<'up'|'down'|'left'|'right'>('up');
  const [cars, setCars] = useState<Car[]>(() => makeCars());
  const [isMoving, setIsMoving] = useState(false);
  const [popups, setPopups] = useState<ScorePopup[]>([]);
  const popupId = useRef(0);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const camTargetZ = useRef(8);
  const camTargetY = useRef(5);
  const chickenPosRef = useRef({ x: 0, z: 0 });
  const chickenLaneRef = useRef(0);
  const isDead = useRef(false);
  const sounds = useSounds();

  useEffect(() => {
    chickenPosRef.current = chickenPos;
  }, [chickenPos]);

  useEffect(() => {
    chickenLaneRef.current = chickenLane;
  }, [chickenLane]);

  const move = useCallback((dir: 'up'|'down'|'left'|'right') => {
    if (phase !== 'playing' || isMoving || isDead.current) return;
    setIsMoving(true);
    setChickenDir(dir);
    sounds.playHop();
    setTimeout(() => setIsMoving(false), 150);

    setChickenPos(prev => {
      let nx = prev.x;
      let nz = prev.z;
      const curLane = chickenLaneRef.current;
      let nl = curLane;

      if (dir === 'up')        { nz -= LANE_WIDTH; nl = curLane + 1; }
      else if (dir === 'down') { nz += LANE_WIDTH; nl = Math.max(0, curLane - 1); }
      else if (dir === 'left') { nx -= 1.8; }
      else if (dir === 'right'){ nx += 1.8; }

      nx = Math.max(-11, Math.min(11, nx));

      if (dir === 'up' && nl > curLane) {
        setChickenLane(nl);
        incrementScore();
        incrementDistance();
        // Milestone every 10 lanes
        if (nl % 10 === 0) sounds.playMilestone();
        else sounds.playScore();

        // Score popup
        setPopups(p => [...p.slice(-5), {
          id: popupId.current++,
          x: nx,
          z: nz,
          value: 100,
          age: 0,
        }]);

        camTargetY.current = 5 + nl * 0.15;
        camTargetZ.current = 8 + nl * 0.3;
      } else if (dir === 'down') {
        setChickenLane(nl);
      }

      return { x: nx, z: nz };
    });
  }, [phase, isMoving, incrementScore, incrementDistance, sounds]);

  useKeyboardControls(move);
  useMobileControls(move);

  useFrame((_, delta) => {
    if (phase !== 'playing') return;

    // Move cars
    setCars(prev => prev.map(car => {
      let nx = car.x + car.speed * car.dir * delta;
      if (nx > 28) nx = -28;
      if (nx < -28) nx = 28;
      return { ...car, x: nx };
    }));

    // Age + remove popups
    setPopups(prev => prev
      .map(p => ({ ...p, age: p.age + delta }))
      .filter(p => p.age < 1.2)
    );

    // Collision detection
    if (!isDead.current) {
      const cx = chickenPosRef.current.x;
      const cl = chickenLaneRef.current;

      for (const car of cars) {
        if (car.lane !== cl) continue;
        const carWidth = car.type === 'bus' ? 1.8 : car.type === 'truck' ? 1.5 : 1.1;
        if (Math.abs(car.x - cx) < carWidth) {
          isDead.current = true;
          sounds.playSquash();
          setPhase('dead');
          break;
        }
      }
    }

    // Smooth camera
    if (cameraRef.current) {
      const targetZ = chickenPosRef.current.z + camTargetZ.current;
      const targetY = camTargetY.current;
      cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * 0.07;
      cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.07;
      cameraRef.current.position.x += (0 - cameraRef.current.position.x) * 0.05;
      cameraRef.current.lookAt(new THREE.Vector3(0, 0, chickenPosRef.current.z));
    }
  });

  const startGame = useCallback(() => {
    isDead.current = false;
    setChickenPos({ x: 0, z: 0 });
    chickenPosRef.current = { x: 0, z: 0 };
    setChickenLane(0);
    chickenLaneRef.current = 0;
    setCars(makeCars());
    setPopups([]);
    camTargetY.current = 5;
    camTargetZ.current = 8;
    setPhase('playing');
  }, [setPhase]);

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={55}
        position={[0, 5, 8]}
        near={0.1}
        far={300}
      />

      {/* Rich lighting */}
      <ambientLight intensity={0.5} color="#334466" />
      <directionalLight
        position={[15, 30, 10]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        color="#fff8f0"
      />
      <directionalLight position={[-10, 10, -5]} intensity={0.4} color="#4466aa" />
      <pointLight position={[0, 8, chickenPos.z]} color="#ffdd88" intensity={1.5} distance={20} />

      <Stars radius={150} depth={60} count={5000} factor={4} saturation={0.6} fade speed={0.5} />
      <fog attach="fog" args={['#0a0a1a', 25, 80]} />

      {/* Ground — extended */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -LANE_COUNT * LANE_WIDTH / 2]} receiveShadow>
        <planeGeometry args={[30, LANE_COUNT * LANE_WIDTH + 20]} />
        <meshStandardMaterial color="#111122" roughness={0.95} />
      </mesh>

      {/* Lanes */}
      {LANES.map((type, i) => (
        <LaneMesh key={i} laneIndex={i} laneType={type} laneWidth={LANE_WIDTH} />
      ))}

      {/* Cars */}
      {cars.map(car => (
        <CarMesh
          key={car.id}
          position={[car.x, 0.35, -car.lane * LANE_WIDTH]}
          color={car.color}
          direction={car.dir}
          type={car.type}
        />
      ))}

      {/* Trees */}
      {LANES.map((type, i) =>
        type === 'safe'
          ? [-13, -9, 9, 13].map(tx => (
              <TreeMesh key={`t${i}-${tx}`} position={[tx, 0, -i * LANE_WIDTH]} />
            ))
          : null
      )}

      {/* Score popups */}
      {popups.map(p => (
        <Text
          key={p.id}
          position={[p.x, 1.5 + p.age * 2, p.z]}
          fontSize={0.5}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
          fillOpacity={Math.max(0, 1 - p.age)}
        >
          +100
        </Text>
      ))}

      {/* Chicken */}
      <ChickenMesh
        position={[chickenPos.x, 0.4, chickenPos.z]}
        isMoving={isMoving}
        isDead={phase === 'dead'}
        direction={chickenDir}
      />

      {/* Invisible tap-to-start plane */}
      {phase === 'idle' && (
        <mesh position={[0, 0.5, 3]} rotation={[-Math.PI / 2, 0, 0]} onClick={startGame}>
          <planeGeometry args={[40, 20]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </>
  );
}
