import { useGameStore } from "../store/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { lamportsToSol } from "../lib/solana";

export function GameHUD() {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const lane = useGameStore((s) => s.lane);
  const prizePool = useGameStore((s) => s.prizePool);
  const playerRank = useGameStore((s) => s.playerRank);
  const timeUntilDraw = useGameStore((s) => s.timeUntilDraw);
  const setPhase = useGameStore((s) => s.setPhase);
  const resetGame = useGameStore((s) => s.resetGame);

  const mins = Math.floor(timeUntilDraw / 60);
  const secs = timeUntilDraw % 60;

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Top HUD */}
      <AnimatePresence>
        {phase === "playing" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 flex justify-between items-start"
          >
            <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
              <div className="text-yellow-400 font-display text-2xl leading-none">
                {score.toLocaleString()}
              </div>
              <div className="text-white/50 text-xs">SCORE</div>
            </div>

            <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-center">
              <div className="text-green-400 font-display text-lg leading-none">
                {lamportsToSol(prizePool)} SOL
              </div>
              <div className="text-white/50 text-xs">PRIZE POT</div>
              <div className="text-yellow-300 text-xs mt-0.5">
                {mins}:{secs.toString().padStart(2, "0")}
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 text-right">
              <div className="text-purple-400 font-display text-2xl leading-none">
                #{playerRank ?? "—"}
              </div>
              <div className="text-white/50 text-xs">RANK</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle screen overlay */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-7xl mb-4"
            >
              🐔
            </motion.div>
            <h2 className="font-display text-4xl text-yellow-400 mb-2">
              TAP TO START
            </h2>
            <p className="text-white/60 text-sm text-center px-8">
              Cross the road, top the leaderboard,
              <br />
              win the prize pot every 5 min
            </p>
            <div className="mt-4 flex gap-3 text-xs text-white/40">
              <span>↑ Forward</span>
              <span>← → Dodge</span>
              <span>↓ Back</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Death screen */}
      <AnimatePresence>
        {phase === "dead" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto"
          >
            <div className="bg-black/80 backdrop-blur-lg rounded-2xl p-8 border border-red-500/30 text-center max-w-sm mx-4">
              <div className="text-5xl mb-3">💀</div>
              <h2 className="font-display text-4xl text-red-400 mb-1">SQUASHED!</h2>
              <p className="text-white/60 text-sm mb-4">
                You made it to lane {lane}
              </p>
              <div className="bg-yellow-400/10 rounded-xl p-3 mb-5 border border-yellow-400/20">
                <div className="text-yellow-400 font-display text-2xl">
                  {score.toLocaleString()}
                </div>
                <div className="text-white/50 text-xs">FINAL SCORE</div>
              </div>
              <button
                onClick={() => resetGame()}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl transition-all active:scale-95"
              >
                TRY AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile D-pad */}
      {phase === "playing" && (
        <div className="absolute bottom-6 right-6 pointer-events-auto">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl border border-white/20 flex items-center justify-center text-white active:bg-white/30 transition-colors"
              onTouchStart={(e) => { e.preventDefault(); }}
              onClick={() => useGameStore.getState().setPhase && undefined}
            >
              ↑
            </button>
            <div />
            <button className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl border border-white/20 flex items-center justify-center text-white active:bg-white/30 transition-colors">
              ←
            </button>
            <button className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl border border-white/20 flex items-center justify-center text-white active:bg-white/30 transition-colors">
              ↓
            </button>
            <button className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl border border-white/20 flex items-center justify-center text-white active:bg-white/30 transition-colors">
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
