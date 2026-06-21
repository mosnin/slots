'use client';

import { create } from "zustand";

export type GamePhase = "idle" | "playing" | "dead" | "won";

export interface LeaderboardEntry {
  player: string;
  score: number;
  lane: number;
  timestamp: number;
}

export interface PastWinner {
  player: string;
  score: number;
  amount: number;
  round: number;
  timestamp: number;
}

interface GameStore {
  phase: GamePhase;
  score: number;
  lane: number;
  prizePool: number;
  timeUntilDraw: number;
  leaderboard: LeaderboardEntry[];
  pastWinners: PastWinner[];
  playerRank: number | null;
  setPhase: (phase: GamePhase) => void;
  setScore: (score: number) => void;
  setLane: (lane: number) => void;
  setPrizePool: (amount: number) => void;
  setTimeUntilDraw: (t: number) => void;
  setLeaderboard: (lb: LeaderboardEntry[]) => void;
  setPastWinners: (pw: PastWinner[]) => void;
  setPlayerRank: (rank: number | null) => void;
  incrementScore: () => void;
  incrementLane: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: "idle",
  score: 0,
  lane: 0,
  prizePool: 0,
  timeUntilDraw: 300,
  leaderboard: [],
  pastWinners: [],
  playerRank: null,
  setPhase: (phase) => set({ phase }),
  setScore: (score) => set({ score }),
  setLane: (lane) => set({ lane }),
  setPrizePool: (amount) => set({ prizePool: amount }),
  setTimeUntilDraw: (t) => set({ timeUntilDraw: t }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setPastWinners: (pastWinners) => set({ pastWinners }),
  setPlayerRank: (playerRank) => set({ playerRank }),
  incrementScore: () => set((s) => ({ score: s.score + 100 })),
  incrementLane: () => set((s) => ({ lane: s.lane + 1 })),
  resetGame: () => set({ phase: "idle", score: 0, lane: 0 }),
}));
