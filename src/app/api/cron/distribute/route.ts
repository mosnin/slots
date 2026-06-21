import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Use service role key for cron (has write access)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify this is a Vercel cron request
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current round's top scorer
    const { data: topScorers } = await supabase
      .from('leaderboard_current')
      .select('*')
      .order('score', { ascending: false })
      .limit(1);

    if (!topScorers || topScorers.length === 0) {
      // No players this round — reset timer
      await resetNextDraw();
      return NextResponse.json({ message: 'No players this round' });
    }

    const winner = topScorers[0];

    // Get prize pool amount from config
    const { data: poolConfig } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'prize_pool_sol')
      .single();

    const prizeSOL = parseFloat(poolConfig?.value || '0');
    if (prizeSOL <= 0) {
      await resetNextDraw();
      return NextResponse.json({ message: 'Prize pool empty' });
    }

    // Get current round number
    const { data: roundConfig } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'current_round')
      .single();
    const round = parseInt(roundConfig?.value || '0') + 1;

    // Send SOL to winner
    let txSig: string | null = null;
    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );

      const treasuryKey = JSON.parse(process.env.TREASURY_KEYPAIR!);
      const treasury = Keypair.fromSecretKey(new Uint8Array(treasuryKey));
      const winnerPubkey = new PublicKey(winner.wallet);

      const lamports = Math.floor(prizeSOL * 1e9);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasury.publicKey,
          toPubkey: winnerPubkey,
          lamports,
        })
      );

      txSig = await sendAndConfirmTransaction(connection, tx, [treasury]);
    } catch (e) {
      console.error('SOL transfer failed:', e);
    }

    // Record the winner
    await supabase.from('winners').insert({
      wallet: winner.wallet,
      score: winner.score,
      distance: winner.distance,
      amount_sol: prizeSOL,
      tx_signature: txSig,
      round,
    });

    // Reset prize pool and update round
    await supabase.from('config').upsert([
      { key: 'prize_pool_sol', value: '0' },
      { key: 'current_round', value: round.toString() },
    ]);

    await resetNextDraw();

    return NextResponse.json({
      success: true,
      winner: winner.wallet,
      amount: prizeSOL,
      txSig,
      round,
    });
  } catch (e: any) {
    console.error('Cron error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function resetNextDraw() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const nextDraw = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await supabase
    .from('config')
    .upsert({ key: 'next_draw_at', value: nextDraw });
}
