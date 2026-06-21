import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PublicKey, Connection } from '@solana/web3.js';
import { validateRun, type SessionToken } from '../../../lib/anticheat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CHICKEN_TOKEN_THRESHOLD = 50_000;
const CHICKEN_MINT = process.env.NEXT_PUBLIC_CHICKEN_MINT;

async function getChickenBalance(wallet: string): Promise<number> {
  if (!CHICKEN_MINT) return Infinity; // token not deployed — everyone eligible
  try {
    const rpc = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const conn = new Connection(rpc, 'confirmed');
    const pk = new PublicKey(wallet);
    const mint = new PublicKey(CHICKEN_MINT);
    const accounts = await conn.getParsedTokenAccountsByOwner(pk, { mint });
    return accounts.value[0]?.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
  } catch {
    return 0;
  }
}

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { wallet, score, distance, session } = await req.json();

    // 1. Wallet must be a valid Solana address
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });
    }

    // 2. A signed session token is required
    const token = session as SessionToken | undefined;
    if (!token || !token.sessionId || !token.sig) {
      return NextResponse.json({ error: 'Missing session' }, { status: 400 });
    }

    // 3. Validate the run (signature, timing, score derivation)
    const result = validateRun(token, wallet, score, distance);
    if (!result.ok) {
      return NextResponse.json({ error: `Rejected: ${result.reason}` }, { status: 403 });
    }

    // 4. Replay protection
    const { error: usedErr } = await supabase
      .from('used_sessions')
      .insert({ session_id: token.sessionId, wallet });
    if (usedErr) {
      if (usedErr.code === '23505') {
        return NextResponse.json({ error: 'Session already used' }, { status: 409 });
      }
      throw usedErr;
    }

    // 5. Check $CHICKEN token eligibility
    const chickenBalance = await getChickenBalance(wallet);
    const eligible = chickenBalance >= CHICKEN_TOKEN_THRESHOLD;

    // 6. Record the score — eligible scores go to main leaderboard, others to practice
    const { error } = await supabase.from('scores').insert({
      wallet,
      score,
      distance,
      eligible,
      chicken_balance: Math.floor(chickenBalance === Infinity ? -1 : chickenBalance),
    });
    if (error) throw error;

    // 7. Update player's aggregate stats
    const { data: u } = await supabase
      .from('users')
      .select('games_played, best_score, best_distance')
      .eq('wallet', wallet)
      .single();
    await supabase.from('users').upsert(
      {
        wallet,
        last_seen: new Date().toISOString(),
        games_played: (u?.games_played ?? 0) + 1,
        best_score: Math.max(u?.best_score ?? 0, score),
        best_distance: Math.max(u?.best_distance ?? 0, distance),
      },
      { onConflict: 'wallet' }
    );

    return NextResponse.json({ success: true, eligible, chickenBalance: Math.floor(chickenBalance === Infinity ? -1 : chickenBalance) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
