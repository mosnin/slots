'use client';

import { Canvas } from "@react-three/fiber";
import { Environment, PerspectiveCamera, Preload } from "@react-three/drei";
import { Suspense, useEffect } from "react";
import { GameScene } from "./GameScene";
import { GameHUD } from "./GameHUD";
import { useGameStore } from "../store/gameStore";

interface ChickenGameProps {
  onScoreSubmit?: (score: number, lane: number) => void;
}

export function ChickenGame({ onScoreSubmit }: ChickenGameProps) {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const lane = useGameStore((s) => s.lane);

  useEffect(() => {
    if (phase === "dead" && onScoreSubmit) {
      onScoreSubmit(score, lane);
    }
  }, [phase]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        style={{ background: "#0a0a1a" }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <GameScene />
          <Preload all />
        </Suspense>
      </Canvas>
      <GameHUD />
    </div>
  );
}
