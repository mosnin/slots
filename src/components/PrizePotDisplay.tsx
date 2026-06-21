import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../store/gameStore";
import { lamportsToSol } from "../lib/solana";

export function PrizePotDisplay() {
  const prizePool = useGameStore((s) => s.prizePool);
  const timeUntilDraw = useGameStore((s) => s.timeUntilDraw);
  const leaderboard = useGameStore((s) => s.leaderboard);

  const mins = Math.floor(timeUntilDraw / 60);
  const secs = timeUntilDraw % 60;
  const progress = ((300 - timeUntilDraw) / 300) * 100;
  const topPlayer = leaderboard[0];

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-400/20 rounded-3xl p-8 overflow-hidden"
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 shimmer opacity-30" />

        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 to-transparent rounded-3xl" />

        <div className="relative z-10">
          <div className="text-center mb-6">
            <div className="text-white/50 text-sm uppercase tracking-widest mb-1">
              Current Prize Pot
            </div>
            <motion.div
              key={prizePool}
              initial={{ scale: 1.2, color: "#FFD700" }}
              animate={{ scale: 1, color: "#FFFFFF" }}
              className="font-display text-6xl text-white"
            >
              {lamportsToSol(prizePool)} SOL
            </motion.div>
            <div className="text-yellow-400/60 text-sm mt-1">
              ≈ ${(Number(lamportsToSol(prizePool)) * 180).toFixed(2)} USD
            </div>
          </div>

          {/* Countdown */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>Next draw in</span>
              <span className="text-yellow-400 font-mono text-lg font-bold">
                {mins}:{secs.toString().padStart(2, "0")}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          {/* Current leader */}
          {topPlayer ? (
            <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-sm">
                  #1
                </div>
                <div>
                  <div className="text-white text-sm font-medium">
                    {topPlayer.player.slice(0, 6)}...{topPlayer.player.slice(-4)}
                  </div>
                  <div className="text-white/40 text-xs">Current Leader</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-yellow-400 font-bold">
                  {topPlayer.score.toLocaleString()}
                </div>
                <div className="text-white/40 text-xs">pts</div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-4 text-center text-white/30 text-sm">
              No scores yet — play to claim the pot!
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
