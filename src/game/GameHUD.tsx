'use client';

import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

function formatSOL(n: number) {
  return n.toFixed(3);
}

export function GameHUD() {
  const phase = useGameStore(s => s.phase);
  const score = useGameStore(s => s.score);
  const distance = useGameStore(s => s.distance);
  const prizePool = useGameStore(s => s.prizePool);
  const playerRank = useGameStore(s => s.playerRank);
  const timeUntilDraw = useGameStore(s => s.timeUntilDraw);
  const resetGame = useGameStore(s => s.resetGame);

  const mins = Math.floor(timeUntilDraw / 60);
  const secs = timeUntilDraw % 60;
  const timerPct = ((300 - timeUntilDraw) / 300) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Playing HUD */}
      <AnimatePresence>
        {phase === 'playing' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 p-3"
          >
            {/* Score bar */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="bg-black/70 backdrop-blur border border-yellow-400/30 rounded-2xl px-4 py-2 flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl text-yellow-400 leading-none">
                    {score.toLocaleString()}
                  </span>
                  <span className="text-white/40 text-xs">pts</span>
                </div>
                <div className="text-white/40 text-[10px] mt-0.5">🏁 {distance} lanes</div>
              </div>

              <div className="bg-black/70 backdrop-blur border border-green-400/30 rounded-2xl px-3 py-2 text-center min-w-[90px]">
                <div className="text-green-400 font-bold text-sm leading-none">
                  {formatSOL(prizePool)} SOL
                </div>
                <div className="text-white/40 text-[10px] mt-0.5">prize pot</div>
                {/* Timer bar */}
                <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-yellow-400 rounded-full transition-all duration-1000"
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
                <div className="text-yellow-300 text-[10px] font-mono mt-0.5">
                  {mins}:{secs.toString().padStart(2, '0')}
                </div>
              </div>

              <div className="bg-black/70 backdrop-blur border border-purple-400/30 rounded-2xl px-3 py-2 text-center min-w-[60px]">
                <div className="text-purple-400 font-display text-xl leading-none">
                  {playerRank ? `#${playerRank}` : '—'}
                </div>
                <div className="text-white/40 text-[10px]">rank</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle splash */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pb-20"
          >
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="text-8xl mb-5 drop-shadow-2xl"
            >
              🐔
            </motion.div>
            <motion.h2
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="font-display text-5xl text-yellow-400 drop-shadow-lg mb-2 tracking-wider"
            >
              TAP TO CLUCK
            </motion.h2>
            <p className="text-white/50 text-sm text-center px-12 leading-relaxed">
              Cross lanes · top the board · win real SOL
            </p>
            <div className="mt-5 flex gap-4 text-white/30 text-xs">
              <span className="flex items-center gap-1">↑ forward</span>
              <span className="flex items-center gap-1">← → dodge</span>
              <span className="flex items-center gap-1">↓ back</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Death screen */}
      <AnimatePresence>
        {phase === 'dead' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 0.5 }}
              className="bg-black/90 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30 text-center max-w-xs mx-4 shadow-2xl"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: 3, duration: 0.3 }}
                className="text-6xl mb-3"
              >
                💀
              </motion.div>
              <h2 className="font-display text-5xl text-red-400 mb-1 tracking-wide">SQUASHED!</h2>
              <p className="text-white/50 text-sm mb-5">
                You made it {distance} lane{distance !== 1 ? 's' : ''}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="bg-yellow-400/10 rounded-xl p-3 border border-yellow-400/20">
                  <div className="text-yellow-400 font-display text-2xl">{score.toLocaleString()}</div>
                  <div className="text-white/40 text-xs">score</div>
                </div>
                <div className="bg-purple-400/10 rounded-xl p-3 border border-purple-400/20">
                  <div className="text-purple-400 font-display text-2xl">{distance}</div>
                  <div className="text-white/40 text-xs">lanes</div>
                </div>
              </div>

              {playerRank && (
                <div className="bg-green-400/10 rounded-xl p-2 mb-4 border border-green-400/20 text-green-400 text-sm">
                  🏆 You&apos;re ranked #{playerRank} this round!
                </div>
              )}

              <button
                onClick={resetGame}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3.5 rounded-2xl text-lg transition-all active:scale-95 shadow-lg shadow-yellow-400/20"
              >
                🐔 TRY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile D-pad - bottom center */}
      {phase === 'playing' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="grid grid-cols-3 gap-2">
            {[
              [null, '↑', null],
              ['←', '↓', '→'],
            ].map((row, ri) =>
              row.map((btn, ci) =>
                btn ? (
                  <button
                    key={`${ri}-${ci}`}
                    className="w-14 h-14 bg-white/10 active:bg-white/25 backdrop-blur rounded-2xl border border-white/20 flex items-center justify-center text-white text-xl font-bold shadow-lg transition-colors"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      const dir = ({ '↑': 'up', '↓': 'down', '←': 'left', '→': 'right' } as Record<string, string>)[btn];
                      if (dir) window.dispatchEvent(new CustomEvent('dpad', { detail: dir }));
                    }}
                  >
                    {btn}
                  </button>
                ) : (
                  <div key={`${ri}-${ci}`} />
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
