'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameScene } from "./GameScene";
import { GameHUD } from "./GameHUD";
import { useGameStore } from "../store/gameStore";

interface ChickenGameProps {
  onScoreSubmit?: (score: number, distance: number) => void;
}

function Preloader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [8, 15, 22, 18, 25, 12]; // simulate load steps
    let i = 0;
    const tick = () => {
      if (i >= steps.length) return;
      setProgress(p => Math.min(100, p + steps[i++]));
      if (i < steps.length) setTimeout(tick, 180 + Math.random() * 120);
    };
    setTimeout(tick, 80);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a1628]">
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
        className="text-7xl mb-6 select-none"
        style={{ filter: 'drop-shadow(0 0 22px rgba(255,200,0,0.65))' }}
      >
        🐔
      </motion.div>
      <div
        className="font-display text-yellow-400 text-2xl mb-4 tracking-widest"
        style={{ textShadow: '0 0 20px rgba(251,191,36,0.5)' }}
      >
        LOADING…
      </div>
      <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.15, ease: 'linear' }}
        />
      </div>
      <p className="text-white/25 text-xs mt-3">Preparing the road…</p>
    </div>
  );
}

export function ChickenGame({ onScoreSubmit }: ChickenGameProps) {
  const [ready, setReady] = useState(false);
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const distance = useGameStore((s) => s.distance);

  // Brief preloader so the canvas has time to set up
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === "dead" && onScoreSubmit) {
      onScoreSubmit(score, distance);
    }
  }, [phase]); // eslint-disable-line

  if (!ready) return <Preloader />;

  return (
    <div className="relative w-full h-full">
      <GameScene />
      <GameHUD />
    </div>
  );
}
