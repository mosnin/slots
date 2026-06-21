'use client';

import { ChickenGame } from "../game/ChickenGame";
import { motion } from "framer-motion";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useGameStore } from "../store/gameStore";
import { lamportsToSol } from "../lib/solana";

interface GamePageProps {
  onBack: () => void;
  onScoreSubmit: (score: number, lane: number) => void;
}

export function GamePage({ onBack, onScoreSubmit }: GamePageProps) {
  const prizePool = useGameStore((s) => s.prizePool);
  const timeUntilDraw = useGameStore((s) => s.timeUntilDraw);
  const leaderboard = useGameStore((s) => s.leaderboard);

  const mins = Math.floor(timeUntilDraw / 60);
  const secs = timeUntilDraw % 60;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
      {/* Mini header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/50 backdrop-blur shrink-0">
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-green-400 font-bold">
              {lamportsToSol(prizePool)} SOL
            </span>
            <span className="text-white/30">pot</span>
          </div>
          <div className="text-yellow-400">
            {mins}:{secs.toString().padStart(2, "0")}
          </div>
        </div>
        <WalletMultiButton />
      </div>

      {/* Game canvas - fill remaining */}
      <div className="flex-1 relative">
        <ChickenGame onScoreSubmit={onScoreSubmit} />
      </div>

      {/* Mini leaderboard strip */}
      <div className="shrink-0 border-t border-white/5 bg-black/50 backdrop-blur px-4 py-2">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <span className="text-white/30 text-xs shrink-0">TOP:</span>
          {leaderboard.slice(0, 5).map((entry, i) => (
            <div
              key={entry.player}
              className="flex items-center gap-1 shrink-0"
            >
              <span className="text-yellow-400 text-xs">#{i + 1}</span>
              <span className="text-white/60 text-xs">
                {entry.player.slice(0, 4)}...{entry.player.slice(-4)}
              </span>
              <span className="text-white text-xs font-bold">
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <span className="text-white/30 text-xs">No scores yet — be first!</span>
          )}
        </div>
      </div>
    </div>
  );
}
