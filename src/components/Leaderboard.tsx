import { motion } from "framer-motion";
import { useGameStore } from "../store/gameStore";
import { useWallet } from "@solana/wallet-adapter-react";

export function Leaderboard() {
  const leaderboard = useGameStore((s) => s.leaderboard);
  const { publicKey } = useWallet();

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-display text-xl text-white">LEADERBOARD</h3>
        <span className="text-white/30 text-xs">Live • resets every 5 min</span>
      </div>

      <div className="divide-y divide-white/5">
        {leaderboard.length === 0 ? (
          <div className="px-6 py-8 text-center text-white/30 text-sm">
            <div className="text-3xl mb-2">🐔</div>
            No players yet — be the first!
          </div>
        ) : (
          leaderboard.slice(0, 10).map((entry, i) => {
            const isMe = publicKey?.toBase58() === entry.player;
            return (
              <motion.div
                key={entry.player}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 px-6 py-3 transition-colors ${
                  isMe ? "bg-yellow-400/10" : "hover:bg-white/5"
                }`}
              >
                <div className="w-8 text-center">
                  {medals[i] || (
                    <span className="text-white/40 text-sm font-mono">
                      #{i + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium truncate ${
                      isMe ? "text-yellow-400" : "text-white"
                    }`}
                  >
                    {entry.player.slice(0, 6)}...{entry.player.slice(-4)}
                    {isMe && (
                      <span className="ml-1 text-yellow-400/60 text-xs">
                        (you)
                      </span>
                    )}
                  </div>
                  <div className="text-white/30 text-xs">
                    Lane {entry.lane}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`font-bold ${
                      i === 0 ? "text-yellow-400" : "text-white"
                    }`}
                  >
                    {entry.score.toLocaleString()}
                  </div>
                  {i === 0 && (
                    <div className="text-yellow-400/60 text-xs">🏆 Leading</div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
