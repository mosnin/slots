'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

function formatSOL(n: number) {
  return n.toFixed(3);
}

const SOLSCAN = 'https://solscan.io/tx/';

export function GameHUD() {
  const phase = useGameStore(s => s.phase);
  const score = useGameStore(s => s.score);
  const distance = useGameStore(s => s.distance);
  const prizePool = useGameStore(s => s.prizePool);
  const playerRank = useGameStore(s => s.playerRank);
  const timeUntilDraw = useGameStore(s => s.timeUntilDraw);
  const leaderboard = useGameStore(s => s.leaderboard);
  const pastWinners = useGameStore(s => s.pastWinners);
  const resetGame = useGameStore(s => s.resetGame);

  // Optimistic live rank: where would the current score place right now?
  // This updates every hop without waiting for a server round-trip.
  const liveRank = leaderboard.length === 0
    ? 1
    : leaderboard.filter(e => e.score > score).length + 1;

  const mins = Math.floor(timeUntilDraw / 60);
  const secs = timeUntilDraw % 60;
  const timerPct = ((300 - timeUntilDraw) / 300) * 100;

  // Personal best stored in localStorage
  const bestRef = useRef(0);
  useEffect(() => {
    const stored = parseInt(localStorage.getItem('cr_best') || '0', 10);
    bestRef.current = stored;
  }, []);
  useEffect(() => {
    if (phase === 'dead' && score > 0) {
      const prev = parseInt(localStorage.getItem('cr_best') || '0', 10);
      if (score > prev) {
        localStorage.setItem('cr_best', String(score));
        bestRef.current = score;
      }
    }
  }, [phase, score]);

  const isNewBest = phase === 'dead' && score > 0 && score >= bestRef.current;
  const leaderScore = leaderboard[0]?.score ?? 0;
  const gapToLeader = leaderScore > 0 ? leaderScore - score : null;
  const lastWinner = pastWinners[0];

  return (
    <div className="absolute inset-0 pointer-events-none select-none">

      {/* ── Playing HUD ── */}
      <AnimatePresence>
        {phase === 'playing' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 p-3"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              {/* Score + distance */}
              <div className="bg-black/70 backdrop-blur border border-yellow-400/30 rounded-2xl px-4 py-2 flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl text-yellow-400 leading-none">{score.toLocaleString()}</span>
                  <span className="text-white/40 text-xs">pts</span>
                </div>
                <div className="text-white/40 text-[10px] mt-0.5">🏁 {distance} lanes</div>
              </div>

              {/* Prize pot + countdown */}
              <div className="bg-black/70 backdrop-blur border border-green-400/30 rounded-2xl px-3 py-2 text-center min-w-[90px]">
                <div className="text-green-400 font-bold text-sm leading-none">
                  {prizePool > 0 ? `${formatSOL(prizePool)} ◎` : '— ◎'}
                </div>
                <div className="text-white/40 text-[10px] mt-0.5">prize pot</div>
                <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${timerPct}%` }} />
                </div>
                <div className="text-yellow-300 text-[10px] font-mono mt-0.5">{mins}:{secs.toString().padStart(2, '0')}</div>
              </div>

              {/* Live rank (optimistic, updates every hop) */}
              <div className={`bg-black/70 backdrop-blur rounded-2xl px-3 py-2 text-center min-w-[60px] border ${liveRank === 1 ? 'border-yellow-400/60' : 'border-purple-400/30'}`}>
                <div className={`font-display text-xl leading-none ${liveRank === 1 ? 'text-yellow-400' : 'text-purple-400'}`}>
                  #{liveRank}
                </div>
                <div className="text-white/40 text-[10px]">{liveRank === 1 ? '👑 leading' : 'rank'}</div>
              </div>
            </div>

            {/* Live gap to leader */}
            {leaderboard.length > 0 && (
              <div className="text-center">
                <span className="bg-black/50 backdrop-blur rounded-full px-3 py-0.5 text-white/30 text-[10px]">
                  {liveRank === 1
                    ? leaderboard.length > 0 && leaderboard[0]?.score < score
                      ? `Leading by ${(score - leaderboard[0].score).toLocaleString()} pts`
                      : "You're in the lead — keep going!"
                    : `${(leaderboard[liveRank - 2]?.score - score || 0).toLocaleString()} pts to reach #${liveRank - 1}`
                  }
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Idle splash ── */}
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

            {/* Prize pot on idle screen */}
            {prizePool > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex items-center gap-2 bg-black/50 backdrop-blur rounded-2xl px-4 py-2 border border-yellow-400/25"
              >
                <span className="text-yellow-400 font-display text-lg">{formatSOL(prizePool)} ◎</span>
                <span className="text-white/35 text-xs">in the pot · draw in {mins}:{secs.toString().padStart(2, '0')}</span>
              </motion.div>
            )}

            <div className="mt-5 flex gap-4 text-white/30 text-xs">
              <span>↑ forward</span>
              <span>← → dodge</span>
              <span>↓ back</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Death screen ── */}
      <AnimatePresence>
        {phase === 'dead' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto px-4"
          >
            {/* Confetti burst for new personal best */}
            {isNewBest && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 20 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{
                      left: `${10 + Math.random() * 80}%`,
                      top: '-10px',
                      background: ['#FFD700', '#f97316', '#22c55e', '#3b82f6', '#a855f7'][i % 5],
                    }}
                    animate={{ y: '110vh', rotate: Math.random() * 720, opacity: [1, 1, 0] }}
                    transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.4, ease: 'easeIn' }}
                  />
                ))}
              </div>
            )}

            <motion.div
              initial={{ rotate: 0, scale: 0.85 }}
              animate={{ rotate: [0, -8, 8, -3, 0], scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-black/92 backdrop-blur-xl rounded-3xl border text-center w-full max-w-sm shadow-2xl overflow-hidden"
              style={{ borderColor: isNewBest ? 'rgba(251,191,36,0.5)' : 'rgba(220,38,38,0.3)' }}
            >
              {/* New best banner */}
              {isNewBest && (
                <div className="py-2 px-4 text-xs font-bold uppercase tracking-widest text-black" style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316)' }}>
                  ⭐ New Personal Best!
                </div>
              )}

              <div className="p-7">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: 2, duration: 0.25 }}
                  className="text-6xl mb-2"
                >
                  💀
                </motion.div>
                <h2 className="font-display text-5xl text-red-400 mb-1 tracking-wide">SQUASHED!</h2>
                <p className="text-white/50 text-sm mb-5">
                  You made it {distance} lane{distance !== 1 ? 's' : ''} deep
                </p>

                {/* Score grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl p-3 border border-yellow-400/20" style={{ background: 'rgba(251,191,36,0.07)' }}>
                    <div className="text-yellow-400 font-display text-2xl">{score.toLocaleString()}</div>
                    <div className="text-white/40 text-xs">this run</div>
                  </div>
                  <div className="rounded-xl p-3 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-white/70 font-display text-2xl">{bestRef.current.toLocaleString()}</div>
                    <div className="text-white/40 text-xs">personal best</div>
                  </div>
                </div>

                {/* Leaderboard context */}
                {playerRank ? (
                  <div className="rounded-xl p-3 border border-green-400/20 mb-4" style={{ background: 'rgba(34,197,94,0.07)' }}>
                    <div className="text-green-400 text-sm font-bold">🏆 You're ranked #{playerRank} this round!</div>
                    {playerRank === 1
                      ? <div className="text-green-300/60 text-xs mt-0.5">You're in the lead — play again to defend it</div>
                      : gapToLeader !== null && <div className="text-white/35 text-xs mt-0.5">{gapToLeader.toLocaleString()} pts behind #1</div>
                    }
                  </div>
                ) : leaderScore > 0 ? (
                  <div className="rounded-xl p-3 border border-white/8 mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-white/50 text-sm">Leader has {leaderScore.toLocaleString()} pts</div>
                    {gapToLeader !== null && <div className="text-white/25 text-xs mt-0.5">You need {gapToLeader.toLocaleString()} more to take #1</div>}
                  </div>
                ) : null}

                {/* Draw timer */}
                <div className="flex items-center justify-between rounded-xl p-3 border border-white/8 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div>
                    <div className="text-white/40 text-xs">Next draw</div>
                    <div className="text-yellow-400 font-mono font-bold text-lg leading-none">{mins}:{secs.toString().padStart(2, '0')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/40 text-xs">Prize pot</div>
                    <div className="text-green-400 font-bold text-sm">{prizePool > 0 ? `${formatSOL(prizePool)} ◎` : '—'}</div>
                  </div>
                </div>

                {/* Last winner */}
                {lastWinner && lastWinner.tx_signature && (
                  <a
                    href={`${SOLSCAN}${lastWinner.tx_signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl p-2.5 border border-white/8 mb-4 hover:border-yellow-400/30 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">Last winner</div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-xs">{lastWinner.wallet.slice(0, 6)}…{lastWinner.wallet.slice(-4)}</span>
                      <span className="text-green-400 text-xs font-bold">+{Number(lastWinner.amount_sol).toFixed(4)} ◎ ↗</span>
                    </div>
                  </a>
                )}

                <button
                  onClick={resetGame}
                  className="w-full text-black font-bold py-3.5 rounded-2xl text-lg transition-all active:scale-95 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #f97316 100%)', boxShadow: '0 0 20px rgba(251,191,36,0.25)' }}
                >
                  🐔 TRY AGAIN
                </button>

                <button
                  onClick={() => {
                    const text = `🐔 I scored ${score.toLocaleString()} pts on Chicken Road! Cross the road, win real SOL every 5 min. Can you beat me?`;
                    const url = typeof window !== 'undefined' ? window.location.origin : '';
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="w-full mt-2 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95 border border-white/10 text-white/50 hover:text-white hover:border-white/20"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  𝕏 Share score
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating D-pad (mobile only, bottom-left, translucent overlay) ── */}
      {phase === 'playing' && (
        <div className="absolute bottom-4 left-3 pointer-events-auto md:hidden" data-dpad>
          <div className="grid grid-cols-3 gap-1">
            {([[null, '↑', null], ['←', '↓', '→']] as (string | null)[][]).map((row, ri) =>
              row.map((btn, ci) =>
                btn ? (
                  <button
                    key={`${ri}-${ci}`}
                    data-dpad
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 text-sm font-bold active:scale-90 transition-transform"
                    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}
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
