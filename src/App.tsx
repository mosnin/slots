import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { LandingPage } from "./components/LandingPage";
import { GamePage } from "./components/GamePage";
import { useGameStore } from "./store/gameStore";
import {
  fetchGameState,
  fetchPastWinners,
  submitScore,
  lamportsToSol,
  GAME_STATE_PDA,
} from "./lib/solana";
import toast from "react-hot-toast";

export function App() {
  const [page, setPage] = useState<"landing" | "game">("landing");
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const {
    setLeaderboard,
    setPastWinners,
    setPrizePool,
    setTimeUntilDraw,
    setPlayerRank,
    phase,
  } = useGameStore();

  // Build provider when wallet is connected
  const getProvider = () => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return new AnchorProvider(
      connection,
      { publicKey, signTransaction, signAllTransactions },
      { commitment: "confirmed" }
    );
  };

  // Poll game state every 10s
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const refresh = async () => {
      const provider = getProvider();
      if (!provider) return;

      try {
        const state = await fetchGameState(provider);
        if (!state) return;

        const lb = state.leaderboard
          .filter((e: any) => e.score.toNumber() > 0)
          .map((e: any) => ({
            player: e.player.toBase58(),
            score: e.score.toNumber(),
            lane: e.lane.toNumber(),
            timestamp: e.timestamp.toNumber(),
          }));

        setLeaderboard(lb);
        setPrizePool(state.prizePool.toNumber());

        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - state.lastDistribution.toNumber();
        setTimeUntilDraw(Math.max(0, 300 - elapsed));

        if (publicKey) {
          const rank = lb.findIndex((e: any) => e.player === publicKey.toBase58());
          setPlayerRank(rank >= 0 ? rank + 1 : null);
        }

        const winners = await fetchPastWinners(provider);
        setPastWinners(
          winners.map((w: any) => ({
            player: w.player.toBase58(),
            score: w.score.toNumber(),
            amount: w.amount.toNumber(),
            round: w.round.toNumber(),
            timestamp: w.timestamp.toNumber(),
          }))
        );
      } catch (e) {
        // silently ignore fetch errors
      }
    };

    refresh();
    timer = setInterval(refresh, 10_000);
    return () => clearInterval(timer);
  }, [publicKey, signTransaction, signAllTransactions]);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => {
      setTimeUntilDraw((prev) => Math.max(0, prev - 1));
    }, 1_000);
    return () => clearInterval(t);
  }, []);

  const handleScoreSubmit = async (score: number, lane: number) => {
    if (score === 0) return;
    const provider = getProvider();
    if (!provider) {
      toast.error("Connect wallet to save your score");
      return;
    }
    try {
      toast.loading("Saving score on-chain...", { id: "score" });
      await submitScore(provider, score, lane);
      toast.success(`Score ${score} saved! 🐔`, { id: "score" });
    } catch (e: any) {
      toast.error(e.message?.slice(0, 60) || "Failed to save score", {
        id: "score",
      });
    }
  };

  if (page === "game") {
    return (
      <GamePage
        onBack={() => setPage("landing")}
        onScoreSubmit={handleScoreSubmit}
      />
    );
  }

  return <LandingPage onPlay={() => setPage("game")} />;
}
