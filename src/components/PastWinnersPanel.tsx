'use client';

import { motion } from "framer-motion";
import { useGameStore } from "../store/gameStore";

const SOLSCAN = 'https://solscan.io/tx/';

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
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
        <span className="text-white/30 text-xs">Verified on-chain</span>
      </div>

      <div className="divide-y divide-white/5">
        {pastWinners.length === 0 ? (
          <div className="px-6 py-8 text-center text-white/30 text-sm">
            <div className="text-3xl mb-2">🏆</div>
            First winner coming soon!
          </div>
        ) : (
          pastWinners.slice(0, 10).map((winner, i) => (
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
                  {winner.wallet.slice(0, 6)}…{winner.wallet.slice(-4)}
                </div>
                <div className="text-white/30 text-xs">
                  Round {winner.round} · {timeAgo(winner.created_at)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-green-400 font-bold text-sm">
                  +{Number(winner.amount_sol).toFixed(4)} ◎
                </div>
                {winner.tx_signature ? (
                  <a
                    href={`${SOLSCAN}${winner.tx_signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400/60 text-xs hover:text-blue-400 transition-colors"
                  >
                    verify ↗
                  </a>
                ) : (
                  <div className="text-white/20 text-xs">pending</div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {pastWinners.length > 0 && (
        <div className="px-6 py-3 border-t border-white/5 text-center">
          <span className="text-white/20 text-xs">All payouts verifiable on Solscan</span>
        </div>
      )}
    </motion.div>
  );
}
