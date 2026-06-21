'use client';

import { motion } from "framer-motion";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGameStore } from "../store/gameStore";
import { Leaderboard } from "./Leaderboard";
import { PastWinnersPanel } from "./PastWinnersPanel";
import { AssetSlot } from "./AssetSlot";
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

const CHARACTERS = [
  { id: 'char-classic.png',  name: 'Cluck Norris',  rarity: 'Common',    color: '#f5eecc' },
  { id: 'char-golden.png',   name: 'Golden Goose',  rarity: 'Legendary', color: '#FFD700' },
  { id: 'char-cyber.png',    name: 'Cyber Chick',   rarity: 'Epic',      color: '#06b6d4' },
  { id: 'char-zombie.png',   name: 'Dead Peck',     rarity: 'Rare',      color: '#84cc16' },
];

const RARITY_COLOR: Record<string, string> = {
  Common: '#9ca3af', Rare: '#3b82f6', Epic: '#a855f7', Legendary: '#f59e0b',
};

const FEATURES = [
  { icon: '🏁', id: 'feat-difficulty.png', title: 'Endless & Brutal', desc: 'Lanes never stop. Cars get faster and thicker the deeper you push.' },
  { icon: '⚡', id: 'feat-realtime.png',   title: 'Real-Time Board',  desc: 'Every hop updates the global leaderboard live, no refresh needed.' },
  { icon: '💸', id: 'feat-payout.png',     title: 'Auto SOL Payouts', desc: 'Top scorer is paid the full pot every 5 minutes — straight to wallet.' },
  { icon: '🎮', id: 'feat-controls.png',   title: 'Play Anywhere',    desc: 'Keyboard, swipe, or on-screen D-pad. Full mobile + desktop support.' },
];

const FAQ = [
  { q: 'How do I win SOL?', a: 'Score the highest on the leaderboard before the 5-minute timer hits zero. When it does, the entire prize pot is automatically sent to the top wallet.' },
  { q: 'Where does the prize pot come from?', a: 'The pot is funded by the $CHICKEN token creator rewards on pump.fun. The more the token trades, the bigger every round’s pot.' },
  { q: 'Do I need to pay to play?', a: 'No. Playing is free. You only need to connect a Solana wallet so we know where to send your winnings.' },
  { q: 'Is it fair?', a: 'Scores are skill-based and validated server-side. Payouts run on an automated schedule with on-chain transaction receipts you can verify.' },
];

export function LandingPage({ onPlay }: LandingPageProps) {
  const { connected } = useWallet();
  const prizePool = useGameStore((s) => s.prizePool);
  const timeUntilDraw = useGameStore((s) => s.timeUntilDraw);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const pastWinners = useGameStore((s) => s.pastWinners);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const mins = Math.floor(timeUntilDraw / 60);
  const secs = timeUntilDraw % 60;
  const progress = Math.max(2, (1 - timeUntilDraw / 300) * 100);
  const topPlayer = leaderboard[0];
  const totalPaidOut = pastWinners.reduce((acc, w) => acc + w.amount_sol, 0);

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-x-hidden">

      {/* ─── Background ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251,191,36,0.07) 0%, transparent 65%), #050510' }}
        />
        {ROAD_LANES.map((y) => (
          <div key={y} className="absolute w-full" style={{ top: `${y}%`, height: '24px', background: 'rgba(255,255,255,0.008)', borderTop: '1px solid rgba(255,255,255,0.022)', borderBottom: '1px solid rgba(255,255,255,0.022)' }} />
        ))}
        {BG_CARS.map((car, i) => (
          <div key={i} className="absolute" style={{ top: `calc(${car.laneY}% + 7px)`, left: 0, height: '10px', width: `${car.w}px`, borderRadius: '3px', background: car.color, opacity: 0.1, boxShadow: `0 0 ${Math.floor(car.w / 2)}px ${car.color}88`, willChange: 'transform', animation: `${car.rev ? 'bgCarRev' : 'bgCar'} ${car.dur}s linear ${car.delay}s infinite` }} />
        ))}
        {/* scanline overlay for arcade feel */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)' }} />
      </div>

      {/* ─── Nav ─── */}
      <nav className="relative z-20 flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-black/30 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl select-none" style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))' }}>🐔</span>
          <div>
            <div className="font-display text-xl leading-none text-yellow-400" style={{ textShadow: '0 0 20px rgba(251,191,36,0.45)' }}>CHICKEN ROAD</div>
            <div className="text-white/25 text-[10px] tracking-widest uppercase">Win SOL every 5 min</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <a href="#play" className="hover:text-yellow-400 transition-colors">Play</a>
          <a href="#characters" className="hover:text-yellow-400 transition-colors">Characters</a>
          <a href="#leaderboard" className="hover:text-yellow-400 transition-colors">Leaderboard</a>
          <a href="#faq" className="hover:text-yellow-400 transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          {/* Social link placeholders */}
          <div className="hidden sm:flex items-center gap-1.5">
            {['𝕏', '✈', '📈'].map((s, i) => (
              <a key={i} href="#" title="Add link" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-yellow-400 hover:border-yellow-400/30 transition-colors text-sm">{s}</a>
            ))}
          </div>
          <WalletMultiButton />
        </div>
      </nav>

      {/* ─── Hero (split: pitch + game preview window) ─── */}
      <section id="play" className="relative z-10 max-w-6xl mx-auto px-5 pt-12 pb-10 grid lg:grid-cols-2 gap-10 items-center">

        {/* Left: pitch */}
        <div className="text-center lg:text-left">
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

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3">
              <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} onClick={onPlay}
                className="px-10 py-4 rounded-2xl font-display text-2xl text-black font-bold tracking-wider w-full sm:w-auto"
                style={{ background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #f97316 100%)', boxShadow: '0 0 50px rgba(251,191,36,0.4), 0 4px 24px rgba(0,0,0,0.5)' }}>
                🎮 PLAY NOW
              </motion.button>
              {!connected && (
                <div className="text-white/30 text-xs sm:max-w-[140px] text-center sm:text-left">Connect wallet to save scores &amp; win</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right: arcade-style game preview window */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.5 }}>
          <div className="p-px rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.6), rgba(249,115,22,0.3), rgba(255,255,255,0.06))' }}>
            <div className="rounded-[23px] overflow-hidden bg-[#0a0a18]">
              {/* fake window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5 bg-black/40">
                <span className="w-3 h-3 rounded-full bg-red-400/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <span className="w-3 h-3 rounded-full bg-green-400/70" />
                <span className="ml-2 text-white/30 text-xs font-mono">chickengame.wtf — live gameplay</span>
              </div>
              <div className="relative">
                <AssetSlot id="hero-trailer.webm" label="Gameplay trailer / hero clip" ratio="16/10" rounded="rounded-none" note="Looping gameplay capture or trailer" />
                {/* play button overlay */}
                <button onClick={onPlay} className="absolute inset-0 flex items-center justify-center group">
                  <span className="w-16 h-16 rounded-full bg-yellow-400/90 flex items-center justify-center text-black text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-yellow-400/40">▶</span>
                </button>
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
                  <span className="text-5xl md:text-6xl" style={{ color: '#FFD700', textShadow: '0 0 40px rgba(251,191,36,0.7)' }}>{prizePool.toFixed(4)}</span>
                  <span className="text-lg text-yellow-400/50 ml-1.5">SOL</span>
                </div>
                <p className="text-white/25 text-xs mt-1">≈ ${(prizePool * 180).toFixed(2)} USD</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-white/30 text-[10px] uppercase tracking-widest">Next draw</span>
                  <span className="font-mono text-yellow-400 font-bold text-lg">{mins}:{secs.toString().padStart(2, '0')}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316)', boxShadow: '0 0 8px rgba(251,191,36,0.5)' }} animate={{ width: `${progress}%` }} transition={{ duration: 0.9, ease: 'linear' }} />
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
                <div className="text-white/20 text-sm text-center py-2">No scores yet — claim it!</div>
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
            { icon: '💸', value: totalPaidOut > 0 ? `${totalPaidOut.toFixed(2)}◎` : '0◎', label: 'Paid Out' },
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

      {/* ─── Character showcase ─── */}
      <section id="characters" className="relative z-10 px-5 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-yellow-400/60 text-xs font-bold uppercase tracking-[0.3em]">Skins · Coming soon</span>
            <h2 className="font-display text-4xl text-white/85 mt-1">MEET THE FLOCK</h2>
            <p className="text-white/35 text-sm mt-2 max-w-md mx-auto">Unlock collectible chicken skins. Each has the same skill ceiling — pure drip, no pay-to-win.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CHARACTERS.map((char, i) => (
              <motion.div key={char.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-3 border border-white/8 group hover:border-yellow-400/30 transition-colors" style={{ background: 'rgba(255,255,255,0.025)' }}>
                <AssetSlot id={char.id} label={char.name} ratio="1/1" rounded="rounded-xl" note="Character portrait" />
                <div className="mt-3 px-1">
                  <div className="text-white/80 text-sm font-bold truncate">{char.name}</div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: RARITY_COLOR[char.rarity] }}>● {char.rarity}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative z-10 px-5 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl text-center text-white/85 mb-8">WHY IT SLAPS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex gap-4 rounded-2xl p-4 border border-white/8" style={{ background: 'rgba(255,255,255,0.025)' }}>
                <div className="w-20 shrink-0">
                  <AssetSlot id={f.id} label="" ratio="1/1" rounded="rounded-xl" note="" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{f.icon}</span>
                    <h3 className="font-display text-xl text-white/85">{f.title}</h3>
                  </div>
                  <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Screenshot gallery ─── */}
      <section className="relative z-10 px-5 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl text-center text-white/85 mb-8">SCREENSHOTS</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { id: 'shot-rush.webp', label: 'Rush hour' },
              { id: 'shot-milestone.webp', label: 'Milestone hop' },
              { id: 'shot-leaderboard.webp', label: 'Live board' },
              { id: 'shot-night.webp', label: 'Night mode' },
              { id: 'shot-win.webp', label: 'Payout moment' },
              { id: 'shot-mobile.webp', label: 'Mobile play' },
            ].map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <AssetSlot id={s.id} label={s.label} ratio="4/3" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How to play ─── */}
      <section className="relative z-10 px-5 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-4xl text-center text-white/85 mb-8">HOW IT WORKS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num: '01', icon: '🔗', title: 'Connect Wallet', desc: 'Link Phantom or Solflare — one click, no sign-up.' },
              { num: '02', icon: '🐔', title: 'Cross the Road', desc: 'Dodge cars, advance lanes, rack up the highest score.' },
              { num: '03', icon: '💸', title: 'Win Every 5 Min', desc: 'Top scorer gets the whole pot, sent automatically.' },
            ].map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-yellow-400/20 transition-colors" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="absolute top-4 right-4 font-display text-5xl text-white/[0.04] group-hover:text-white/[0.07] transition-colors">{step.num}</div>
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="font-display text-xl text-white/80">{step.title}</div>
                <div className="text-white/35 text-sm leading-relaxed mt-2">{step.desc}</div>
              </motion.div>
            ))}
          </div>
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
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-5 pb-4 text-white/40 text-sm leading-relaxed">{item.a}</motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative z-10 px-5 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl p-10 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(249,115,22,0.08))', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div className="text-5xl mb-3">🐔</div>
          <h2 className="font-display text-4xl text-white mb-2">THINK YOU CAN CROSS?</h2>
          <p className="text-white/40 text-sm mb-6">The pot is live and the clock is ticking. Be the top chicken.</p>
          <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} onClick={onPlay}
            className="px-12 py-4 rounded-2xl font-display text-2xl text-black font-bold tracking-wider"
            style={{ background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #f97316 100%)', boxShadow: '0 0 50px rgba(251,191,36,0.4)' }}>
            🎮 PLAY NOW
          </motion.button>
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
            <a href="#" className="hover:text-yellow-400 transition-colors">Twitter / X</a>
            <a href="#" className="hover:text-yellow-400 transition-colors">Telegram</a>
            <a href="#" className="hover:text-yellow-400 transition-colors">pump.fun</a>
          </div>
          <span className="text-white/20 text-xs">chickengame.wtf · No house edge</span>
        </div>
      </footer>
    </div>
  );
}
