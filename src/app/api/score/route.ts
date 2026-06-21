import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PublicKey } from '@solana/web3.js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { wallet, score, distance } = await req.json();

    // Validate wallet address
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });
    }

    if (typeof score !== 'number' || score < 0 || score > 1000000) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    const { error } = await supabase.from('scores').insert({ wallet, score, distance });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
