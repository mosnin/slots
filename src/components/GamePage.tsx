'use client';

import dynamic from "next/dynamic";
const ChickenGame = dynamic(
  () => import("../game/ChickenGame").then((m) => ({ default: m.ChickenGame })),
  { ssr: false }
);
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGameStore } from "../store/gameStore";

interface GamePageProps {
  onBack: () => void;
  onScoreSubmit: (score: number, distance: number) => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function GamePage({ onBack, onScoreSubmit }: GamePageProps) {
  const prizePool = useGameStore((s) => s.prizePool);
  const timeUntilDraw = useGameStore((s) => s.timeUntilDraw);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const { publicKey } = useWallet();

  const mins = Math.floor(timeUntilDraw / 60);
  const secs = timeUntilDraw % 60;
  const urgency = timeUntilDraw < 60;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/60 backdrop-blur shrink-0">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          ← Back
        </button>

        {/* Pot + timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-green-400 font-bold text-sm">
              {prizePool > 0 ? `${prizePool.toFixed(4)} ◎` : '—'}
            </span>
            <span className="text-white/25 text-xs hidden sm:block">pot</span>
          </div>
          <div className={`font-mono font-bold text-sm px-2 py-0.5 rounded-lg ${urgency ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-yellow-400/10 text-yellow-400'}`}>
            {mins}:{secs.toString().padStart(2, '0')}
          </div>
        </div>

        <WalletMultiButton />
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 relative overflow-hidden">
        <ChickenGame onScoreSubmit={onScoreSubmit} />
      </div>

      {/* ── Live leaderboard strip ── */}
      <div className="shrink-0 border-t border-white/5 bg-black/60 backdrop-blur px-4 py-2">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <span className="text-white/25 text-[10px] uppercase tracking-widest shrink-0">TOP SCORES</span>
          {leaderboard.length === 0 ? (
            <span className="text-white/25 text-xs">No scores yet — you could be first</span>
          ) : (
            leaderboard.slice(0, 6).map((entry, i) => {
              const isMe = publicKey?.toBase58() === entry.wallet;
              return (
                <div key={entry.wallet} className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg ${isMe ? 'bg-yellow-400/10 border border-yellow-400/25' : ''}`}>
                  <span className="text-xs">{MEDALS[i] ?? `#${i + 1}`}</span>
                  <span className={`text-xs ${isMe ? 'text-yellow-400' : 'text-white/50'}`}>
                    {entry.wallet.slice(0, 4)}…{entry.wallet.slice(-3)}
                  </span>
                  <span className={`text-xs font-bold ${isMe ? 'text-yellow-300' : 'text-white/80'}`}>
                    {entry.score.toLocaleString()}
                  </span>
                  {isMe && <span className="text-yellow-400/50 text-[10px]">you</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
