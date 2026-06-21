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

const FEE_BUFFER_LAMPORTS = 10_000; // leave room for the network fee

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

    const prizeSOL = parseFloat((await getConfig(supabase, 'prize_pool_sol')) || '0');
    if (prizeSOL <= 0) {
      await resetNextDraw(supabase);
      return NextResponse.json({ message: 'Prize pool empty' });
    }

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
        amount_sol: prizeSOL,
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

    // Advance the round + zero the pool now that the claim is locked in.
    await supabase.from('config').upsert([
      { key: 'prize_pool_sol', value: '0' },
      { key: 'current_round', value: round.toString() },
    ]);
    await resetNextDraw(supabase);

    // ── Send SOL ───────────────────────────────────────────────────────
    let txSig: string | null = null;
    let payoutSOL = prizeSOL;
    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );
      const treasury = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(process.env.TREASURY_KEYPAIR!))
      );

      // Never attempt to send more than the treasury actually holds.
      const balance = await connection.getBalance(treasury.publicKey);
      let lamports = Math.floor(prizeSOL * 1e9);
      const maxSendable = balance - FEE_BUFFER_LAMPORTS;
      if (lamports > maxSendable) lamports = maxSendable;

      if (lamports <= 0) {
        await supabase.from('winners').update({ amount_sol: 0 }).eq('id', claim.id);
        return NextResponse.json({ message: 'Treasury insufficient', round, winner: winner.wallet });
      }
      payoutSOL = lamports / 1e9;

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasury.publicKey,
          toPubkey: new PublicKey(winner.wallet),
          lamports,
        })
      );
      txSig = await sendAndConfirmTransaction(connection, tx, [treasury]);
    } catch (e) {
      console.error('SOL transfer failed:', e);
      // Claim row stays (tx_signature null) so the round isn't reprocessed/double-paid.
    }

    // Record the resulting signature / actual amount on the existing claim row.
    await supabase
      .from('winners')
      .update({ tx_signature: txSig, amount_sol: payoutSOL })
      .eq('id', claim.id);

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
