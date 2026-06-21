'use client';

import { motion } from "framer-motion";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGameStore } from "../store/gameStore";
import { Leaderboard } from "./Leaderboard";
import { PastWinnersPanel } from "./PastWinnersPanel";

interface LandingPageProps {
  onPlay: () => void;
}

const ROAD_LANES = [13, 27, 41, 55, 69, 83];

// Background cars — negative delays distribute them across the screen at load
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

export function LandingPage({ onPlay }: LandingPageProps) {
  const { connected } = useWallet();
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
        {/* Base radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251,191,36,0.07) 0%, transparent 65%), #050510',
          }}
        />

        {/* Road lanes */}
        {ROAD_LANES.map((y) => (
          <div
            key={y}
            className="absolute w-full"
            style={{
              top: `${y}%`,
              height: '24px',
              background: 'rgba(255,255,255,0.008)',
              borderTop: '1px solid rgba(255,255,255,0.022)',
              borderBottom: '1px solid rgba(255,255,255,0.022)',
            }}
          />
        ))}

        {/* Animated cars */}
        {BG_CARS.map((car, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: `calc(${car.laneY}% + 7px)`,
              left: 0,
              height: '10px',
              width: `${car.w}px`,
              borderRadius: '3px',
              background: car.color,
              opacity: 0.1,
              boxShadow: `0 0 ${Math.floor(car.w / 2)}px ${car.color}88`,
              willChange: 'transform',
              animation: `${car.rev ? 'bgCarRev' : 'bgCar'} ${car.dur}s linear ${car.delay}s infinite`,
            }}
          />
        ))}

        {/* Ambient glow orbs */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'rgba(251,191,36,0.055)' }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[400px] h-[300px] rounded-full blur-[90px] animate-pulse"
          style={{ background: 'rgba(249,115,22,0.04)', animationDuration: '4s' }}
        />
      </div>

      {/* ─── Nav ─── */}
      <nav className="relative z-20 flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/25 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <span
            className="text-2xl select-none"
            style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))' }}
          >
            🐔
          </span>
          <div>
            <div
              className="font-display text-xl leading-none text-yellow-400"
              style={{ textShadow: '0 0 20px rgba(251,191,36,0.45)' }}
            >
              CHICKEN ROAD
            </div>
            <div className="text-white/25 text-[10px] tracking-widest uppercase">
              Powered by Solana
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {topPlayer && (
            <div className="hidden sm:flex items-center gap-2 bg-white/5 rounded-xl px-3 py-1.5 border border-white/8">
              <span className="text-sm">🏆</span>
              <span className="text-white/50 text-xs font-mono">
                {topPlayer.wallet.slice(0, 4)}…{topPlayer.wallet.slice(-4)}
              </span>
              <span className="text-yellow-400 text-xs font-bold">
                {topPlayer.score.toLocaleString()}
              </span>
            </div>
          )}
          <WalletMultiButton />
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-10 flex flex-col items-center text-center px-5 pt-10 pb-10">

        {/* Bouncing chicken */}
        <motion.div
          animate={{ y: [0, -16, 0], rotate: [-3, 3, -3] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
          className="text-8xl mb-5 select-none"
          style={{ filter: 'drop-shadow(0 0 30px rgba(255,200,0,0.55))' }}
        >
          🐔
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <h1 className="font-display leading-none">
            <span
              className="block text-7xl md:text-[7rem] lg:text-[9rem]"
              style={{ color: '#FFD700', textShadow: '0 0 60px rgba(251,191,36,0.4)' }}
            >
              CHICKEN
            </span>
            <span className="block text-5xl md:text-7xl text-white/85">ROAD</span>
          </h1>
          <p className="text-white/30 text-xs tracking-[0.25em] uppercase mt-3 mb-8">
            Cross the road · Top the board · Win real SOL
          </p>
        </motion.div>

        {/* Prize pot card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-xs mb-7"
        >
          {/* Gradient border */}
          <div
            className="p-px rounded-3xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(251,191,36,0.5) 0%, rgba(249,115,22,0.3) 50%, rgba(255,255,255,0.06) 100%)',
            }}
          >
            <div
              className="rounded-[23px] p-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #0d0c1e 0%, #090714 100%)',
              }}
            >
              {/* Inner glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% -10%, rgba(251,191,36,0.3) 0%, transparent 55%)',
                }}
              />

              <div className="relative">
                <p className="text-white/30 text-[10px] uppercase tracking-[0.25em] mb-3">
                  💰 Current Prize Pot
                </p>

                <motion.div
                  key={Math.round(prizePool * 10000)}
                  initial={{ scale: 1.07 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="font-display leading-none mb-1"
                >
                  <span
                    className="text-6xl"
                    style={{
                      color: '#FFD700',
                      textShadow: '0 0 40px rgba(251,191,36,0.7)',
                    }}
                  >
                    {prizePool.toFixed(4)}
                  </span>
                  <span className="text-xl text-yellow-400/50 ml-1.5">SOL</span>
                </motion.div>

                <p className="text-white/25 text-xs mb-5">
                  ≈ ${(prizePool * 180).toFixed(2)} USD
                </p>

                {/* Countdown */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-white/30 text-[10px] uppercase tracking-widest">
                      Next draw
                    </span>
                    <span className="font-mono text-yellow-400 font-bold">
                      {mins}:{secs.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #fbbf24, #f97316)',
                        boxShadow: '0 0 8px rgba(251,191,36,0.5)',
                      }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.9, ease: 'linear' }}
                    />
                  </div>
                </div>

                {/* Leader */}
                {topPlayer ? (
                  <div
                    className="flex items-center gap-3 rounded-2xl p-3"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className="text-xl select-none">🏆</span>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-white/75 text-sm font-medium truncate">
                        {topPlayer.wallet.slice(0, 6)}…{topPlayer.wallet.slice(-4)}
                      </div>
                      <div className="text-white/25 text-xs">Currently leading</div>
                    </div>
                    <div className="text-yellow-400 font-bold text-sm shrink-0">
                      {topPlayer.score.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-white/20 text-sm text-center py-2">
                    No scores yet — claim the pot!
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPlay}
            className="px-12 py-4 rounded-2xl font-display text-2xl text-black font-bold tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #f97316 100%)',
              boxShadow:
                '0 0 50px rgba(251,191,36,0.4), 0 4px 24px rgba(0,0,0,0.5)',
            }}
          >
            🎮 PLAY NOW
          </motion.button>
          {!connected && (
            <p className="text-white/20 text-xs">
              Connect your Solana wallet to save scores &amp; win prizes
            </p>
          )}
        </motion.div>
      </section>

      {/* ─── Stats strip ─── */}
      {(leaderboard.length > 0 || pastWinners.length > 0) && (
        <section className="relative z-10 px-5 pb-8">
          <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
            {[
              { icon: '👥', value: `${leaderboard.length}`, label: 'Players' },
              { icon: '🔄', value: `${pastWinners.length}`, label: 'Rounds' },
              {
                icon: '💸',
                value: totalPaidOut > 0 ? `${totalPaidOut.toFixed(3)} SOL` : '0 SOL',
                label: 'Paid Out',
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-4 text-center border border-white/5"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                <div className="text-xl mb-1 select-none">{stat.icon}</div>
                <div className="font-display text-lg text-yellow-400 leading-none">
                  {stat.value}
                </div>
                <div className="text-white/25 text-xs mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── How It Works ─── */}
      <section className="relative z-10 px-5 pb-14">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-3xl text-center text-white/35 tracking-[0.2em] mb-7"
          >
            HOW IT WORKS
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                num: '01',
                icon: '🔗',
                title: 'Connect Wallet',
                desc: 'Link Phantom or Solflare — one click, no sign-up needed',
              },
              {
                num: '02',
                icon: '🐔',
                title: 'Cross the Road',
                desc: 'Dodge cars, advance lanes, and build the highest score',
              },
              {
                num: '03',
                icon: '💸',
                title: 'Win Every 5 Min',
                desc: 'Top scorer gets the entire pot sent straight to their wallet — automatically',
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 border border-white/5 relative overflow-hidden group transition-colors hover:border-yellow-400/20"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="absolute top-4 right-4 font-display text-5xl text-white/[0.03] group-hover:text-white/[0.06] transition-colors select-none">
                  {step.num}
                </div>
                <div className="text-3xl mb-3 select-none">{step.icon}</div>
                <div className="font-display text-xl text-white/80">{step.title}</div>
                <div className="text-white/35 text-sm leading-relaxed mt-2">{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Leaderboard + Winners ─── */}
      <section className="relative z-10 px-5 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <Leaderboard />
          <PastWinnersPanel />
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-white/5 px-5 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 select-none">
            <span>🐔</span>
            <span className="font-display text-white/30 tracking-widest text-sm">
              CHICKEN ROAD
            </span>
          </div>
          <p className="text-white/20 text-xs text-center">
            Built on Solana · Automatic prize distribution · No house edge
          </p>
          <span className="text-white/20 text-xs">chickengame.wtf</span>
        </div>
      </footer>
    </div>
  );
}
