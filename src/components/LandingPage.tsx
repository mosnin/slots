'use client';

import { motion, AnimatePresence } from "framer-motion";
import { WalletMultiButton, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGameStore, CHICKEN_TOKEN_THRESHOLD } from "../store/gameStore";
import { Leaderboard } from "./Leaderboard";
import { PastWinnersPanel } from "./PastWinnersPanel";
import { useState } from "react";

interface LandingPageProps {
  onPlay: () => void;
}

const ROAD_LANES = [13, 27, 41, 55, 69, 83];
const BG_CARS = [
  { laneY: 13, w: 44, color: '#ef4444', dur: 6,   delay: 0,    rev: false },
  { laneY: 13, w: 28, color: '#3b82f6', dur: 6,   delay: -3,   rev: false },
  { laneY: 27, w: 36, color: '#eab308', dur: 5.5, delay: 0,    rev: true  },
  { laneY: 27, w: 56, color: '#a855f7', dur: 5.5, delay: -2.5, rev: true  },
  { laneY: 41, w: 32, color: '#22c55e', dur: 7,   delay: 0,    rev: false },
  { laneY: 41, w: 48, color: '#06b6d4', dur: 7,   delay: -3.5, rev: false },
  { laneY: 55, w: 40, color: '#f97316', dur: 5,   delay: 0,    rev: true  },
  { laneY: 55, w: 30, color: '#ec4899', dur: 5,   delay: -2.5, rev: true  },
  { laneY: 69, w: 52, color: '#ef4444', dur: 6.5, delay: 0,    rev: false },
  { laneY: 69, w: 34, color: '#6366f1', dur: 6.5, delay: -3,   rev: false },
  { laneY: 83, w: 36, color: '#eab308', dur: 5.5, delay: 0,    rev: true  },
  { laneY: 83, w: 44, color: '#22c55e', dur: 5.5, delay: -2.7, rev: true  },
];

// Mini game preview lanes — left to right, right to left
const PREVIEW_CARS = [
  { lane: 1, color: '#ef4444', w: 48, dur: 2.2, delay: 0 },
  { lane: 1, color: '#3b82f6', w: 36, dur: 2.2, delay: -1.1 },
  { lane: 2, color: '#eab308', w: 42, dur: 1.9, delay: 0,   rev: true },
  { lane: 2, color: '#a855f7', w: 32, dur: 1.9, delay: -0.95, rev: true },
  { lane: 3, color: '#22c55e', w: 44, dur: 2.5, delay: 0 },
  { lane: 3, color: '#06b6d4', w: 38, dur: 2.5, delay: -1.25 },
  { lane: 4, color: '#f97316', w: 50, dur: 1.8, delay: 0,   rev: true },
  { lane: 4, color: '#ec4899', w: 30, dur: 1.8, delay: -0.9, rev: true },
];

const RARITY_STYLES: Record<string, { badge: string; border: string; glow: string; emoji: string }> = {
  Common:    { badge: 'text-gray-400 bg-gray-400/10 border-gray-400/20',   border: 'border-white/10',         glow: 'none',                        emoji: '🐔' },
  Rare:      { badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20',   border: 'border-blue-400/25',      glow: '0 0 20px rgba(59,130,246,0.2)', emoji: '🐔' },
  Epic:      { badge: 'text-purple-400 bg-purple-400/10 border-purple-400/20', border: 'border-purple-400/30', glow: '0 0 24px rgba(168,85,247,0.25)', emoji: '🐔' },
  Legendary: { badge: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', border: 'border-yellow-400/40', glow: '0 0 30px rgba(251,191,36,0.35)', emoji: '🐔' },
};

const CHARACTERS = [
  { name: 'Cluck Norris',  rarity: 'Common',    bg: 'from-green-900/40 to-green-950/60',  tint: '#f5eecc', desc: 'The OG. Steady, reliable, crosses every road.' },
  { name: 'Golden Goose',  rarity: 'Legendary', bg: 'from-yellow-900/40 to-yellow-950/60', tint: '#FFD700', desc: 'Forged in the fires of 1000x rugs. Untouchable.' },
  { name: 'Cyber Chick',   rarity: 'Epic',      bg: 'from-cyan-900/40 to-cyan-950/60',    tint: '#06b6d4', desc: 'Wired to the blockchain. Never misses a lane.' },
  { name: 'Dead Peck',     rarity: 'Rare',      bg: 'from-lime-900/40 to-lime-950/60',    tint: '#84cc16', desc: 'Undead. Keeps clucking no matter what.' },
];

const FEATURES = [
  { icon: '🏁', title: 'Endless & Brutal', desc: 'Lanes never stop. Cars get faster, thicker, and a rising floor starts creeping up — keeping you in constant motion.' },
  { icon: '⚡', title: 'Real-Time Board',  desc: 'Every hop updates the global leaderboard live. See yourself climb in real time.' },
  { icon: '💸', title: 'Auto SOL Payouts', desc: 'Top scorer is paid the full prize pot every 5 minutes — automatically, on-chain, straight to their wallet.' },
  { icon: '🎮', title: 'Play Anywhere',    desc: 'Keyboard, swipe, or on-screen D-pad. Full mobile and desktop support — no app install.' },
];

const FAQ = [
  {
    q: 'How do I win SOL?',
    a: 'Score the highest on the leaderboard before the 5-minute timer hits zero. When it does, the entire prize pot is automatically sent on-chain to the top wallet — no claim needed.',
  },
  {
    q: 'Where does the prize pot come from?',
    a: 'The pot is funded by $CHICKEN token creator rewards on pump.fun. Every trade of the token automatically sends a percentage to the treasury wallet, which becomes the prize every round.',
  },
  {
    q: 'Do I need to pay to play?',
    a: 'No. Playing is completely free. You only need to connect a Solana wallet so we know where to send your winnings if you top the board.',
  },
  {
    q: 'Is it fair?',
    a: 'Yes. Scores are validated server-side with HMAC-signed game sessions — you can\'t submit a fake score. Payouts run on an automated schedule with public on-chain transaction receipts.',
  },
  {
    q: `Why do I need ${CHICKEN_TOKEN_THRESHOLD.toLocaleString()} $CHICKEN to win?`,
    a: `The token-holding requirement ensures the prize pot rewards actual $CHICKEN holders, not random visitors. The prize pot itself is funded by $CHICKEN creator rewards on pump.fun, so it makes sense that holders are the ones competing for it. Anyone can play for free — you just won't win the jackpot without the tokens.`,
  },
  {
    q: 'I don\'t have a Solana wallet — what do I do?',
    a: 'Download Phantom from phantom.app — it takes about 30 seconds and works on desktop (Chrome extension) and mobile (iOS/Android app). It\'s free.',
  },
];

// Mini animated game preview for the hero section
function GamePreview({ onPlay }: { onPlay: () => void }) {
  const LANE_H = 46;
  const LANES = 5;
  const totalH = LANE_H * LANES + 16;

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{ height: totalH, background: '#0a0a14' }}
      onClick={onPlay}
    >
      {/* Sky strip at top */}
      <div className="absolute top-0 left-0 right-0 h-4" style={{ background: 'linear-gradient(to bottom, #63b3ed, #0a0a14)' }} />

      {/* Lanes */}
      {Array.from({ length: LANES }, (_, i) => {
        const isSafe = i % 2 === 0;
        const top = 16 + i * LANE_H;
        return (
          <div key={i} className="absolute left-0 right-0" style={{ top, height: LANE_H, background: isSafe ? '#4a8030' : '#4a4a4a' }}>
            {!isSafe && (
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-0.5 border-t-2 border-dashed border-white/15" />
              </div>
            )}
            {isSafe && (
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #5a9b3a, #3d7027)' }} />
            )}
          </div>
        );
      })}

      {/* Cars */}
      {PREVIEW_CARS.map((car, i) => {
        const top = 16 + (car.lane - 0.5) * LANE_H - 10;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              top,
              left: 0,
              height: 20,
              width: car.w,
              borderRadius: 6,
              background: `linear-gradient(to bottom, ${car.color}dd, ${car.color}88)`,
              boxShadow: `0 0 8px ${car.color}66`,
              animation: `${(car as any).rev ? 'bgCarRev' : 'bgCar'} ${car.dur}s linear ${car.delay}s infinite`,
            }}
          />
        );
      })}

      {/* Chicken */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
        className="absolute text-2xl"
        style={{ top: 16 + 2 * LANE_H - 18, left: '50%', transform: 'translateX(-50%)' }}
      >
        🐔
      </motion.div>

      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-14 h-14 rounded-full flex items-center justify-center text-black text-xl font-bold shadow-xl"
          style={{ background: 'linear-gradient(135deg, #fde68a, #fbbf24, #f97316)', boxShadow: '0 0 30px rgba(251,191,36,0.5)' }}
        >
          ▶
        </motion.div>
      </div>

      {/* Score ticker */}
      <div className="absolute top-2 left-3 bg-black/60 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1.5">
        <span className="text-yellow-400 font-bold text-xs font-mono">3,200 pts</span>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      </div>
    </div>
  );
}

export function LandingPage({ onPlay }: LandingPageProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showWalletHelp, setShowWalletHelp] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handlePlay = () => {
    if (connected) onPlay();
    else setVisible(true);
  };

  const prizePool = useGameStore((s) => s.prizePool);
  const timeUntilDraw = useGameStore((s) => s.timeUntilDraw);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const pastWinners = useGameStore((s) => s.pastWinners);

  const mins = Math.floor(timeUntilDraw / 60);
  const secs = timeUntilDraw % 60;
  const progress = Math.max(2, (1 - timeUntilDraw / 300) * 100);
  const topPlayer = leaderboard[0];
  const totalPaidOut = pastWinners.reduce((acc, w) => acc + w.amount_sol, 0);

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-x-hidden">

      {/* ─── Background ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251,191,36,0.07) 0%, transparent 65%), #050510' }} />
        {ROAD_LANES.map((y) => (
          <div key={y} className="absolute w-full" style={{ top: `${y}%`, height: '24px', background: 'rgba(255,255,255,0.008)', borderTop: '1px solid rgba(255,255,255,0.022)', borderBottom: '1px solid rgba(255,255,255,0.022)' }} />
        ))}
        {BG_CARS.map((car, i) => (
          <div key={i} className="absolute" style={{ top: `calc(${car.laneY}% + 7px)`, left: 0, height: '10px', width: `${car.w}px`, borderRadius: '3px', background: car.color, opacity: 0.1, boxShadow: `0 0 ${Math.floor(car.w / 2)}px ${car.color}88`, willChange: 'transform', animation: `${car.rev ? 'bgCarRev' : 'bgCar'} ${car.dur}s linear ${car.delay}s infinite` }} />
        ))}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }} />
      </div>

      {/* ─── Nav ─── */}
      <nav className="relative z-20 border-b border-white/5 bg-black/30 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none" style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))' }}>🐔</span>
            <div>
              <div className="font-display text-xl leading-none text-yellow-400" style={{ textShadow: '0 0 20px rgba(251,191,36,0.45)' }}>CHICKEN ROAD</div>
              <div className="text-white/25 text-[10px] tracking-widest uppercase hidden sm:block">Win SOL every 5 min</div>
            </div>
          </div>
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
            <a href="#play" className="hover:text-yellow-400 transition-colors">Play</a>
            <a href="#how-it-works" className="hover:text-yellow-400 transition-colors">How It Works</a>
            <a href="#leaderboard" className="hover:text-yellow-400 transition-colors">Leaderboard</a>
            <a href="#faq" className="hover:text-yellow-400 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            {/* Social links */}
            <div className="hidden sm:flex items-center gap-1.5">
              {[
                { label: '𝕏', href: process.env.NEXT_PUBLIC_TWITTER_URL || null, title: 'Twitter / X' },
                { label: '✈', href: process.env.NEXT_PUBLIC_TELEGRAM_URL || null, title: 'Telegram' },
                { label: '📈', href: process.env.NEXT_PUBLIC_PUMPFUN_URL || null, title: 'pump.fun' },
              ].map(({ label, href, title }) =>
                href ? (
                  <a key={title} href={href} target="_blank" rel="noopener noreferrer" title={title}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-yellow-400 hover:border-yellow-400/30 transition-colors text-sm">
                    {label}
                  </a>
                ) : null
              )}
            </div>
            {/* Wallet button — compact label on mobile */}
            <div className="hidden sm:block"><WalletMultiButton /></div>
            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 rounded-xl bg-white/8 border border-white/15 flex flex-col items-center justify-center gap-1 ml-1"
              onClick={() => setMobileNavOpen(v => !v)}
              aria-label="Menu"
            >
              <span className={`w-4 h-0.5 bg-white/60 rounded-full transition-all ${mobileNavOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`w-4 h-0.5 bg-white/60 rounded-full transition-all ${mobileNavOpen ? 'opacity-0' : ''}`} />
              <span className={`w-4 h-0.5 bg-white/60 rounded-full transition-all ${mobileNavOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>
          </div>
        </div>
        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 bg-black/60 overflow-hidden"
            >
              <div className="px-5 py-4 flex flex-col gap-1">
                {[
                  { href: '#play', label: '🎮 Play' },
                  { href: '#how-it-works', label: '📖 How It Works' },
                  { href: '#leaderboard', label: '🏆 Leaderboard' },
                  { href: '#faq', label: '❓ FAQ' },
                ].map(({ href, label }) => (
                  <a key={href} href={href} onClick={() => setMobileNavOpen(false)}
                    className="py-3 px-4 rounded-xl text-white/60 hover:text-yellow-400 hover:bg-white/5 transition-colors text-sm font-medium">
                    {label}
                  </a>
                ))}
                <div className="pt-2 border-t border-white/8">
                  <WalletMultiButton />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Hero ─── */}
      <section id="play" className="relative z-10 max-w-6xl mx-auto px-5 pt-10 pb-10 grid lg:grid-cols-2 gap-8 items-center">
        {/* CTA column — always first on mobile */}
        <div className="text-center lg:text-left order-1">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-green-400/10 border border-green-400/25 rounded-full px-3 py-1 mb-5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Live · Round in progress</span>
            </div>

            <h1 className="font-display leading-[0.85] mb-4">
              <span className="block text-6xl md:text-8xl" style={{ color: '#FFD700', textShadow: '0 0 60px rgba(251,191,36,0.4)' }}>CROSS</span>
              <span className="block text-6xl md:text-8xl text-white">THE ROAD</span>
              <span className="block text-3xl md:text-5xl text-white/70 mt-2">WIN REAL <span className="text-orange-400">SOL</span></span>
            </h1>

            <p className="text-white/45 text-base md:text-lg max-w-md mx-auto lg:mx-0 mb-7">
              A brutal arcade chicken-crossing game. Climb the leaderboard, and the highest scorer takes the entire prize pot — automatically, every 5 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 mb-4">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePlay}
                className="px-10 py-4 rounded-2xl font-display text-2xl text-black font-bold tracking-wider w-full sm:w-auto"
                style={{ background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #f97316 100%)', boxShadow: '0 0 50px rgba(251,191,36,0.4), 0 4px 24px rgba(0,0,0,0.5)' }}
              >
                🎮 PLAY NOW
              </motion.button>
            </div>

            {/* Wallet onboarding hint */}
            {!connected && (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center lg:items-start gap-1">
                  <button
                    onClick={() => setShowWalletHelp(!showWalletHelp)}
                    className="text-white/35 text-xs hover:text-white/60 transition-colors underline underline-offset-2"
                  >
                    {showWalletHelp ? '▲ Hide' : '▼ No wallet? Here\'s how →'}
                  </button>
                  {showWalletHelp && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-4 rounded-2xl border border-yellow-400/20 text-left max-w-sm"
                      style={{ background: 'rgba(251,191,36,0.06)' }}
                    >
                      <p className="text-white/70 text-sm font-bold mb-2">Get Phantom in 30 seconds</p>
                      <ol className="text-white/45 text-xs space-y-1.5 list-decimal list-inside">
                        <li>Go to <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline">phantom.app</a> and install the extension</li>
                        <li>Create a new wallet — save your seed phrase somewhere safe</li>
                        <li>Come back here and click "Connect Wallet"</li>
                      </ol>
                      <p className="text-white/25 text-[10px] mt-2">100% free. No SOL needed to play.</p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>

        {/* Game preview — second on mobile, right column on desktop */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.5 }} className="order-2">
          <div className="p-px rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.6), rgba(249,115,22,0.3), rgba(255,255,255,0.06))' }}>
            <div className="rounded-[23px] overflow-hidden bg-[#0a0a18]">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5 bg-black/40">
                <span className="w-3 h-3 rounded-full bg-red-400/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <span className="w-3 h-3 rounded-full bg-green-400/70" />
                <span className="ml-2 text-white/30 text-xs font-mono">chickengame.wtf — live gameplay</span>
              </div>
              <div className="p-3">
                <GamePreview onPlay={handlePlay} />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Live prize pot bar ─── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 pb-12">
        <div className="p-px rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.5), rgba(255,255,255,0.06))' }}>
          <div className="rounded-[23px] p-5 md:p-6 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0d0c1e 0%, #090714 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(251,191,36,0.25) 0%, transparent 55%)' }} />
            <div className="relative grid md:grid-cols-3 gap-5 items-center">
              <div className="text-center md:text-left">
                <p className="text-white/30 text-[10px] uppercase tracking-[0.25em] mb-1">💰 Current Prize Pot</p>
                <div className="font-display leading-none">
                  {prizePool > 0 ? (
                    <>
                      <span className="text-5xl md:text-6xl" style={{ color: '#FFD700', textShadow: '0 0 40px rgba(251,191,36,0.7)' }}>
                        {prizePool.toFixed(4)}
                      </span>
                      <span className="text-lg text-yellow-400/50 ml-1.5">SOL</span>
                    </>
                  ) : (
                    <span className="text-3xl md:text-4xl text-white/30">Filling up…</span>
                  )}
                </div>
                {prizePool > 0
                  ? <p className="text-white/25 text-xs mt-1">≈ ${(prizePool * 180).toFixed(2)} USD</p>
                  : <p className="text-white/25 text-xs mt-1">Grows with every $CHICKEN trade on pump.fun</p>
                }
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-white/30 text-[10px] uppercase tracking-widest">Next draw</span>
                  <span className="font-mono text-yellow-400 font-bold text-lg">{mins}:{secs.toString().padStart(2, '0')}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316)', boxShadow: '0 0 8px rgba(251,191,36,0.5)' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, ease: 'linear' }}
                  />
                </div>
              </div>

              {topPlayer ? (
                <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xl">🏆</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/75 text-sm font-medium truncate">{topPlayer.wallet.slice(0, 6)}…{topPlayer.wallet.slice(-4)}</div>
                    <div className="text-white/25 text-xs">Leading · {topPlayer.score.toLocaleString()} pts</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xl">🎯</span>
                  <div>
                    <div className="text-white/50 text-sm font-medium">No scores yet</div>
                    <div className="text-white/25 text-xs">First player wins everything</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <section className="relative z-10 px-5 pb-14">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          {[
            { icon: '👥', value: `${leaderboard.length}`, label: 'Players' },
            { icon: '🔄', value: `${pastWinners.length}`, label: 'Rounds' },
            { icon: '💸', value: totalPaidOut > 0 ? `${totalPaidOut.toFixed(2)}◎` : '—', label: 'Paid Out' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-4 text-center border border-white/5" style={{ background: 'rgba(255,255,255,0.025)' }}>
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="font-display text-lg text-yellow-400 leading-none">{stat.value}</div>
              <div className="text-white/25 text-xs mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── How to play ─── */}
      <section id="how-it-works" className="relative z-10 px-5 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-4xl text-center text-white/85 mb-2">HOW IT WORKS</h2>
          <p className="text-white/30 text-sm text-center mb-8">Three steps. That's it.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                num: '01', icon: '🔗', title: 'Connect Wallet',
                desc: 'Link Phantom or any Solana wallet. One click, no sign-up, no email.',
                note: 'Don\'t have one? Get Phantom free at phantom.app',
                noteHref: 'https://phantom.app',
              },
              {
                num: '02', icon: '🐔', title: 'Hold $CHICKEN',
                desc: `Hold at least ${CHICKEN_TOKEN_THRESHOLD.toLocaleString()} $CHICKEN tokens to compete for the prize pot. Anyone can play — holders win.`,
                note: 'Buy $CHICKEN on pump.fun',
                noteHref: process.env.NEXT_PUBLIC_PUMPFUN_URL || undefined,
              },
              {
                num: '03', icon: '🏁', title: 'Cross the Road',
                desc: 'Dodge cars, advance lanes, rack up the highest score before the timer hits zero.',
                note: 'A rising floor creeps up — keep moving or get lava\'d',
              },
              {
                num: '04', icon: '💸', title: 'Win Every 5 Min',
                desc: 'The top eligible scorer gets the whole prize pot sent automatically. On-chain, no middleman.',
                note: 'Verify every payout on Solscan',
              },
            ].map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-yellow-400/20 transition-colors" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="absolute top-4 right-4 font-display text-5xl text-white/[0.04] group-hover:text-white/[0.07] transition-colors">{step.num}</div>
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="font-display text-xl text-white/80 mb-2">{step.title}</div>
                <div className="text-white/35 text-sm leading-relaxed mb-3">{step.desc}</div>
                {step.noteHref
                  ? <a href={step.noteHref} target="_blank" rel="noopener noreferrer" className="text-yellow-400/60 text-xs hover:text-yellow-400 transition-colors">→ {step.note}</a>
                  : <div className="text-white/25 text-xs italic">{step.note}</div>
                }
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative z-10 px-5 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl text-center text-white/85 mb-8">WHY IT WORKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex gap-4 rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.025)' }}>
                <div className="text-4xl shrink-0 mt-0.5">{f.icon}</div>
                <div className="flex-1">
                  <h3 className="font-display text-xl text-white/85 mb-1">{f.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Token Gating Explainer ─── */}
      <section className="relative z-10 px-5 pb-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(249,115,22,0.06))', border: '1px solid rgba(234,179,8,0.2)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% -20%, rgba(234,179,8,0.12) 0%, transparent 60%)' }} />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/25 rounded-full px-3 py-1 mb-4">
                  <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Token Holders Win</span>
                </div>
                <h2 className="font-display text-4xl text-white mb-3">HOLD TO COMPETE</h2>
                <p className="text-white/50 text-sm leading-relaxed mb-4">
                  Anyone can play for free. But to compete for the prize pot, you need to hold at least <span className="text-yellow-400 font-bold">{CHICKEN_TOKEN_THRESHOLD.toLocaleString()} $CHICKEN</span>. No tokens? You're in practice mode. Your scores won't count toward the jackpot.
                </p>
                <p className="text-white/35 text-xs leading-relaxed">
                  This keeps the prize pool for real holders. Every $CHICKEN trade on pump.fun generates creator rewards that flow directly to the treasury — the pot you're playing for.
                </p>
                {process.env.NEXT_PUBLIC_PUMPFUN_URL && (
                  <a
                    href={process.env.NEXT_PUBLIC_PUMPFUN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl font-bold text-sm text-black transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #fde68a, #fbbf24, #f97316)' }}
                  >
                    📈 Buy $CHICKEN on pump.fun
                  </a>
                )}
              </div>
              <div className="space-y-3">
                {[
                  { icon: '🎮', label: 'No tokens', desc: 'Play free, practice your skills, see your score — but can\'t win the pot', color: 'text-white/40', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
                  { icon: '🏆', label: `${CHICKEN_TOKEN_THRESHOLD.toLocaleString()}+ $CHICKEN`, desc: 'Full eligibility — top score when the timer hits zero wins the entire pot', color: 'text-yellow-400', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.25)' },
                ].map(tier => (
                  <div key={tier.label} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                    <span className="text-2xl mt-0.5">{tier.icon}</span>
                    <div>
                      <div className={`font-bold text-sm ${tier.color}`}>{tier.label}</div>
                      <div className="text-white/40 text-xs mt-0.5 leading-relaxed">{tier.desc}</div>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-2xl mt-0.5">💸</span>
                  <div>
                    <div className="font-bold text-sm text-white/50">Skins (coming soon)</div>
                    <div className="text-white/30 text-xs mt-0.5 leading-relaxed">Buy chicken skins with USDC → USDC goes into the prize pot → skins give real gameplay advantages</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Leaderboard + winners ─── */}
      <section id="leaderboard" className="relative z-10 px-5 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <Leaderboard />
          <PastWinnersPanel />
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="relative z-10 px-5 pb-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-4xl text-center text-white/85 mb-8">FAQ</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                  <span className="text-white/80 font-medium text-sm">{item.q}</span>
                  <span className={`text-yellow-400 transition-transform shrink-0 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-5 pb-4 text-white/40 text-sm leading-relaxed">
                    {item.a}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative z-10 px-5 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl p-10 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(249,115,22,0.08))', border: '1px solid rgba(251,191,36,0.2)' }}>
          <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-5xl mb-3">🐔</motion.div>
          <h2 className="font-display text-4xl text-white mb-2">THINK YOU CAN CROSS?</h2>
          <p className="text-white/40 text-sm mb-6">The pot is live and the clock is ticking. Be the last one standing.</p>
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePlay}
            className="px-12 py-4 rounded-2xl font-display text-2xl text-black font-bold tracking-wider"
            style={{ background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #f97316 100%)', boxShadow: '0 0 50px rgba(251,191,36,0.4)' }}
          >
            🎮 PLAY NOW
          </motion.button>
          {!connected && (
            <p className="text-white/20 text-xs mt-4">Free to play · Connect wallet to save scores & win</p>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-white/5 px-5 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🐔</span>
            <span className="font-display text-white/30 tracking-widest text-sm">CHICKEN ROAD</span>
          </div>
          <div className="flex items-center gap-4 text-white/30 text-xs">
            {process.env.NEXT_PUBLIC_TWITTER_URL && (
              <a href={process.env.NEXT_PUBLIC_TWITTER_URL} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors">Twitter / X</a>
            )}
            {process.env.NEXT_PUBLIC_TELEGRAM_URL && (
              <a href={process.env.NEXT_PUBLIC_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors">Telegram</a>
            )}
            {process.env.NEXT_PUBLIC_PUMPFUN_URL && (
              <a href={process.env.NEXT_PUBLIC_PUMPFUN_URL} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors">pump.fun</a>
            )}
          </div>
          <span className="text-white/20 text-xs">chickengame.wtf · On-chain payouts · Powered by $CHICKEN</span>
        </div>
      </footer>
    </div>
  );
}
