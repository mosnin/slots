'use client';

import { motion } from "framer-motion";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGameStore } from "../store/gameStore";
import { Leaderboard } from "./Leaderboard";
import { PastWinnersPanel } from "./PastWinnersPanel";
import { PrizePotDisplay } from "./PrizePotDisplay";

interface LandingPageProps {
  onPlay: () => void;
}

export function LandingPage({ onPlay }: LandingPageProps) {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,215,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.3) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🐔</span>
          <div>
            <div className="font-display text-xl text-yellow-400 leading-none">
              CHICKEN ROAD
            </div>
            <div className="text-white/40 text-xs">Powered by Solana</div>
          </div>
        </div>
        <WalletMultiButton />
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="text-8xl mb-6 inline-block"
          >
            🐔
          </motion.div>

          <h1 className="font-display text-5xl md:text-7xl text-white mb-4 leading-tight">
            CROSS THE ROAD.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              WIN REAL SOL.
            </span>
          </h1>

          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            The highest scorer on the leaderboard wins the entire prize pot
            every 5 minutes — automatically, on-chain, no trust required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onPlay}
              className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg rounded-2xl shadow-lg shadow-yellow-400/20 transition-all"
            >
              🎮 PLAY NOW
            </motion.button>
            {!connected && (
              <div className="text-white/40 text-sm">
                Connect wallet to save scores & win prizes
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Prize pot */}
      <section className="relative z-10 px-6 pb-12">
        <PrizePotDisplay />
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl text-center mb-8 text-white/80">
            HOW IT WORKS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: "🔗",
                title: "1. Connect Wallet",
                desc: "Link your Solana wallet (Phantom, Solflare)",
              },
              {
                icon: "🐔",
                title: "2. Play & Score",
                desc: "Cross as many lanes as possible. Each lane = points",
              },
              {
                icon: "💰",
                title: "3. Win Every 5 Min",
                desc: "Top scorer auto-receives the entire prize pot on-chain",
              },
            ].map((step) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-yellow-400/30 transition-colors"
              >
                <div className="text-4xl mb-3">{step.icon}</div>
                <div className="font-bold text-white mb-2">{step.title}</div>
                <div className="text-white/50 text-sm">{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard + Past winners */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Leaderboard />
          <PastWinnersPanel />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center text-white/30 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>🐔</span>
          <span className="font-display text-white/50">CHICKEN ROAD</span>
        </div>
        <p>Built on Solana • Fully on-chain prize distribution • No house edge</p>
      </footer>
    </div>
  );
}
