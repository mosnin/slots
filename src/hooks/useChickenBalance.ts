'use client';

import { useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useGameStore } from '../store/gameStore';

// $CHICKEN SPL token mint — set via env var when token is deployed
const CHICKEN_MINT = process.env.NEXT_PUBLIC_CHICKEN_MINT;

export function useChickenBalance() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const setChickenBalance = useGameStore((s) => s.setChickenBalance);

  useEffect(() => {
    if (!publicKey || !CHICKEN_MINT) {
      // Token not deployed yet — treat all connected wallets as eligible
      setChickenBalance(null);
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const mint = new PublicKey(CHICKEN_MINT);
        const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint });
        const raw = accounts.value[0]?.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
        if (!cancelled) setChickenBalance(raw);
      } catch {
        if (!cancelled) setChickenBalance(0);
      }
    };

    check();
    // Re-check every 30s in case they buy tokens while playing
    const interval = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicKey, connection, setChickenBalance]);
}
