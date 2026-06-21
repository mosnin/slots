import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FEE_BUFFER_LAMPORTS = 100_000; // ~0.0001 SOL — covers tx fee with headroom

function db(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function resetNextDraw(supabase: SupabaseClient) {
  const nextDraw = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await supabase.from('config').upsert({ key: 'next_draw_at', value: nextDraw });
}

async function getConfig(supabase: SupabaseClient, key: string): Promise<string | null> {
  const { data } = await supabase.from('config').select('value').eq('key', key).single();
  return data?.value ?? null;
}

export async function GET(req: Request) {
  const supabase = db();

  // Authn — Vercel cron sends the CRON_SECRET as a bearer token.
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Top scorer of the current round
    const { data: topScorers } = await supabase
      .from('leaderboard_current')
      .select('*')
      .order('score', { ascending: false })
      .limit(1);

    if (!topScorers || topScorers.length === 0) {
      await resetNextDraw(supabase);
      return NextResponse.json({ message: 'No players this round' });
    }
    const winner = topScorers[0];

    // The prize is the treasury's actual on-chain balance (minus a fee reserve).
    if (!process.env.TREASURY_KEYPAIR) {
      await resetNextDraw(supabase);
      return NextResponse.json({ message: 'Treasury not configured' });
    }
    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    let treasury: Keypair;
    try {
      treasury = Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.TREASURY_KEYPAIR)));
    } catch {
      return NextResponse.json({ error: 'Invalid TREASURY_KEYPAIR — must be JSON array of bytes' }, { status: 500 });
    }

    const balance = await connection.getBalance(treasury.publicKey);
    const lamports = balance - FEE_BUFFER_LAMPORTS;
    if (lamports <= 0) {
      await resetNextDraw(supabase);
      return NextResponse.json({ message: 'Treasury empty', winner: winner.wallet });
    }
    const payoutSOL = lamports / 1e9;

    const round = parseInt((await getConfig(supabase, 'current_round')) || '0') + 1;

    // ── Idempotent claim ───────────────────────────────────────────────
    // Insert the winner row FIRST, keyed by a unique `round`. If a concurrent
    // (or retried) invocation already claimed this round, the unique-violation
    // aborts us before any SOL moves — preventing double payouts.
    const { data: claim, error: claimErr } = await supabase
      .from('winners')
      .insert({
        wallet: winner.wallet,
        score: winner.score,
        distance: winner.distance,
        amount_sol: payoutSOL,
        tx_signature: null,
        round,
      })
      .select('id')
      .single();

    if (claimErr) {
      if (claimErr.code === '23505') {
        return NextResponse.json({ message: 'Round already processed', round });
      }
      throw claimErr;
    }

    // Advance the round now that the claim is locked in.
    await supabase.from('config').upsert([{ key: 'current_round', value: round.toString() }]);
    await resetNextDraw(supabase);

    // ── Send SOL ───────────────────────────────────────────────────────
    let txSig: string;
    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasury.publicKey,
          toPubkey: new PublicKey(winner.wallet),
          lamports,
        })
      );
      txSig = await sendAndConfirmTransaction(connection, tx, [treasury]);
    } catch (e: any) {
      console.error('SOL transfer failed:', e);
      // Roll back the claim so the next cron invocation can retry —
      // SOL never left the treasury so it's safe to un-consume this round.
      await supabase.from('winners').delete().eq('id', claim.id);
      await supabase.from('config').upsert([{ key: 'current_round', value: (round - 1).toString() }]);
      return NextResponse.json({ error: `Transfer failed: ${e.message}` }, { status: 500 });
    }

    // Record the confirmed signature on the existing claim row.
    await supabase.from('winners').update({ tx_signature: txSig }).eq('id', claim.id);

    return NextResponse.json({
      success: true,
      winner: winner.wallet,
      amount: payoutSOL,
      txSig,
      round,
    });
  } catch (e: any) {
    console.error('Cron error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
