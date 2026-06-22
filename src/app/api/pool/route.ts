import { NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Keep a small reserve in the treasury for transaction fees / rent.
const RESERVE_LAMPORTS = 5_000_000; // 0.005 SOL

// Module-level cache so many clients polling every ~10s don't hammer the RPC.
let cache: { sol: number; at: number } | null = null;
const CACHE_MS = 12_000;

function getTreasuryPublicKey(): PublicKey | null {
  // Prefer the lightweight public key env var
  if (process.env.NEXT_PUBLIC_TREASURY_WALLET) {
    try { return new PublicKey(process.env.NEXT_PUBLIC_TREASURY_WALLET); } catch { /* fall through */ }
  }
  // Fall back to deriving from keypair if available
  if (process.env.TREASURY_KEYPAIR) {
    try {
      return Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.TREASURY_KEYPAIR))).publicKey;
    } catch { /* fall through */ }
  }
  return null;
}

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json({ sol: cache.sol, cached: true });
  }

  try {
    const treasury = getTreasuryPublicKey();
    if (!treasury) return NextResponse.json({ sol: 0 });

    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    const lamports = await connection.getBalance(treasury);
    const sol = Math.max(0, (lamports - RESERVE_LAMPORTS) / 1e9);
    cache = { sol, at: Date.now() };
    return NextResponse.json({ sol });
  } catch (e: any) {
    return NextResponse.json({ sol: cache?.sol ?? 0, error: e.message });
  }
}
