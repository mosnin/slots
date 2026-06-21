import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PublicKey } from '@solana/web3.js';
import { validateRun, type SessionToken } from '../../../lib/anticheat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // 4. Replay protection — each session id can only be redeemed once.
    const { error: usedErr } = await supabase
      .from('used_sessions')
      .insert({ session_id: token.sessionId, wallet });
    if (usedErr) {
      // 23505 = unique_violation → token already redeemed
      if (usedErr.code === '23505') {
        return NextResponse.json({ error: 'Session already used' }, { status: 409 });
      }
      throw usedErr;
    }

    // 5. Record the score
    const { error } = await supabase.from('scores').insert({ wallet, score, distance });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
