import { motion } from "framer-motion";
import { useGameStore } from "../store/gameStore";

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function PastWinnersPanel() {
  const pastWinners = useGameStore((s) => s.pastWinners);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-display text-xl text-white">PAST WINNERS</h3>
        <span className="text-white/30 text-xs">On-chain history</span>
      </div>

      <div className="divide-y divide-white/5">
        {pastWinners.length === 0 ? (
          <div className="px-6 py-8 text-center text-white/30 text-sm">
            <div className="text-3xl mb-2">🏆</div>
            First winner coming soon!
          </div>
        ) : (
          [...pastWinners]
            .reverse()
            .slice(0, 10)
            .map((winner, i) => (
              <motion.div
                key={`${winner.round}-${i}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-400/10 flex items-center justify-center text-green-400 text-sm shrink-0">
                  💰
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {winner.player.slice(0, 6)}...{winner.player.slice(-4)}
                  </div>
                  <div className="text-white/30 text-xs">
                    Round {winner.round} • {timeAgo(winner.timestamp)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-green-400 font-bold text-sm">
                    +{(winner.amount / 1e9).toFixed(4)} SOL
                  </div>
                  <div className="text-white/30 text-xs">
                    Score: {winner.score.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))
        )}
      </div>
    </motion.div>
  );
}
