import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { issueSession } from '../../../lib/anticheat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Issues a signed game session at the start of a run. The server-stamped
 * `issuedAt` is what pins run timing for anti-cheat — the client cannot forge it.
 */
export async function POST(req: Request) {
  try {
    const { wallet } = await req.json();
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });
    }
    return NextResponse.json(issueSession(wallet));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
