'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LandingPage } from './components/LandingPage';
import { GamePage } from './components/GamePage';
import { useGameStore } from './store/gameStore';
import { getLeaderboard, getPastWinners, getPrizePool, getNextDraw } from './lib/supabase';
import toast from 'react-hot-toast';

export function App() {
  const [page, setPage] = useState<'landing' | 'game'>('landing');
  const { publicKey } = useWallet();
  const {
    setLeaderboard,
    setPastWinners,
    setPrizePool,
    setTimeUntilDraw,
    setPlayerRank,
  } = useGameStore();

  const nextDrawRef = useRef<number>(Date.now() + 300000);

  // Poll Supabase every 10s
  useEffect(() => {
    const refresh = async () => {
      try {
        const [lb, winners, pool, nextDraw] = await Promise.all([
          getLeaderboard(),
          getPastWinners(),
          getPrizePool(),
          getNextDraw(),
        ]);

        setLeaderboard(
          lb.map((e: any) => ({
            wallet: e.wallet,
            score: e.score,
            distance: e.distance,
            last_played: e.last_played,
          }))
        );

        setPastWinners(
          winners.map((w: any) => ({
            wallet: w.wallet,
            score: w.score,
            distance: w.distance,
            amount_sol: w.amount_sol,
            tx_signature: w.tx_signature,
            round: w.round,
            created_at: w.created_at,
          }))
        );

        setPrizePool(pool);
        nextDrawRef.current = nextDraw;

        if (publicKey) {
          const rank = lb.findIndex((e: any) => e.wallet === publicKey.toBase58());
          setPlayerRank(rank >= 0 ? rank + 1 : null);
        }
      } catch (e) {
        // silently ignore fetch errors
      }
    };

    refresh();
    const t = setInterval(refresh, 10_000);
    return () => clearInterval(t);
  }, [publicKey]);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => {
      const remaining = Math.max(0, Math.floor((nextDrawRef.current - Date.now()) / 1000));
      setTimeUntilDraw(remaining);
    }, 1_000);
    return () => clearInterval(t);
  }, []);

  const handleScoreSubmit = async (score: number, distance: number) => {
    if (score === 0 || !publicKey) return;
    try {
      await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toBase58(), score, distance }),
      });
      toast.success(`Score ${score.toLocaleString()} saved! 🐔`);
    } catch {
      toast.error('Failed to save score');
    }
  };

  if (page === 'game') {
    return (
      <GamePage
        onBack={() => setPage('landing')}
        onScoreSubmit={handleScoreSubmit}
      />
    );
  }

  return <LandingPage onPlay={() => setPage('game')} />;
}
