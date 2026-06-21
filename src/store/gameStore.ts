'use client';

import { create } from 'zustand';

export type GamePhase = 'idle' | 'playing' | 'dead';

export const CHICKEN_TOKEN_THRESHOLD = 50_000;

export interface LeaderboardEntry {
  wallet: string;
  score: number;
  distance: number;
  last_played: string;
}

export interface PastWinner {
  wallet: string;
  score: number;
  distance: number;
  amount_sol: number;
  tx_signature: string | null;
  round: number;
  created_at: string;
}

interface GameStore {
  phase: GamePhase;
  score: number;
  distance: number;
  prizePool: number;
  timeUntilDraw: number;
  leaderboard: LeaderboardEntry[];
  pastWinners: PastWinner[];
  playerRank: number | null;
  // Token gating
  chickenBalance: number | null;  // null = not yet checked
  isEligible: boolean;
  setPhase: (phase: GamePhase) => void;
  setScore: (score: number) => void;
  setPrizePool: (amount: number) => void;
  setTimeUntilDraw: (t: number) => void;
  setLeaderboard: (lb: LeaderboardEntry[]) => void;
  setPastWinners: (pw: PastWinner[]) => void;
  setPlayerRank: (rank: number | null) => void;
  setChickenBalance: (balance: number | null) => void;
  incrementScore: () => void;
  incrementDistance: () => void;
  /** @deprecated alias for incrementDistance — kept for GameScene compatibility */
  incrementLane: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'idle',
  score: 0,
  distance: 0,
  prizePool: 0,
  timeUntilDraw: 300,
  leaderboard: [],
  pastWinners: [],
  playerRank: null,
  chickenBalance: null,
  isEligible: false,
  setPhase: (phase) => set({ phase }),
  setScore: (score) => set({ score }),
  setPrizePool: (prizePool) => set({ prizePool }),
  setTimeUntilDraw: (timeUntilDraw) => set({ timeUntilDraw }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setPastWinners: (pastWinners) => set({ pastWinners }),
  setPlayerRank: (playerRank) => set({ playerRank }),
  setChickenBalance: (chickenBalance) => set({
    chickenBalance,
    isEligible: chickenBalance !== null && chickenBalance >= CHICKEN_TOKEN_THRESHOLD,
  }),
  incrementScore: () => set((s) => ({ score: s.score + 100 })),
  incrementDistance: () => set((s) => ({ distance: s.distance + 1 })),
  incrementLane: () => set((s) => ({ distance: s.distance + 1 })),
  resetGame: () => set({ phase: 'idle', score: 0, distance: 0 }),
}));
