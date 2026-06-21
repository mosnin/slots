import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Score = {
  id: string;
  wallet: string;
  score: number;
  distance: number;
  created_at: string;
};

export type Winner = {
  id: string;
  wallet: string;
  score: number;
  distance: number;
  amount_sol: number;
  tx_signature: string | null;
  round: number;
  created_at: string;
};

export async function submitScore(wallet: string, score: number, distance: number) {
  const { error } = await supabase.from('scores').insert({
    wallet,
    score,
    distance,
  });
  if (error) throw error;
}

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard_current')
    .select('*')
    .order('score', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
}

export async function getPastWinners() {
  const { data, error } = await supabase
    .from('winners')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function getPrizePool(): Promise<number> {
  // The prize pot is the treasury's real on-chain balance (minus a fee
  // reserve), served by /api/pool.
  try {
    const res = await fetch('/api/pool');
    if (!res.ok) return 0;
    const { sol } = await res.json();
    return typeof sol === 'number' ? sol : 0;
  } catch {
    return 0;
  }
}

export async function getNextDraw(): Promise<number> {
  const { data } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'next_draw_at')
    .single();
  if (!data) return Date.now() + 300000;
  const t = new Date(data.value).getTime();
  // If the stored timestamp is in the past (stale config / cron hasn't fired),
  // treat it as a fresh 5-minute window so the timer doesn't sit at 0:00.
  return t > Date.now() ? t : Date.now() + 300000;
}
