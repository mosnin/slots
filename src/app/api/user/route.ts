import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PublicKey } from '@solana/web3.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Registers / refreshes a player record when a wallet connects. Creates the
 * row on first connect, otherwise just bumps last_seen.
 */
export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { wallet } = await req.json();
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });
    }

    // Insert if new; on conflict just touch last_seen.
    const { error } = await supabase
      .from('users')
      .upsert(
        { wallet, last_seen: new Date().toISOString() },
        { onConflict: 'wallet', ignoreDuplicates: false }
      );
    if (error) throw error;

    const { data } = await supabase.from('users').select('*').eq('wallet', wallet).single();
    return NextResponse.json({ success: true, user: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
