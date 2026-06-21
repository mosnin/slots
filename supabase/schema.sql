-- Scores table (all scores submitted)
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  score integer not null default 0,
  distance integer not null default 0,
  created_at timestamptz default now()
);

-- Index for fast leaderboard queries
create index if not exists scores_score_idx on scores(score desc);
create index if not exists scores_wallet_idx on scores(wallet);

-- Winners history (must exist before the leaderboard view references it)
create table if not exists winners (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  score integer not null,
  distance integer not null,
  amount_sol numeric(18,9) not null,
  tx_signature text,
  round integer not null default 0,
  created_at timestamptz default now()
);

-- One winner per round — the unique guard that makes payouts idempotent
-- (a retried/concurrent cron run hits this and aborts before sending SOL).
create unique index if not exists winners_round_unique on winners(round);

-- Current round leaderboard view (top score per wallet since last draw).
-- The round boundary is the timestamp of the most recent payout.
create or replace view leaderboard_current as
select
  wallet,
  max(score) as score,
  max(distance) as distance,
  max(created_at) as last_played
from scores
where created_at > (
  select coalesce(max(created_at), now() - interval '5 minutes')
  from winners
)
group by wallet
order by score desc
limit 10;

-- Redeemed game sessions — anti-cheat replay protection. Each signed session
-- token can only be turned into a score once. Service role bypasses RLS, so no
-- public policies are granted here (table is server-write only).
create table if not exists used_sessions (
  session_id text primary key,
  wallet text not null,
  used_at timestamptz default now()
);
alter table used_sessions enable row level security;

-- Players — one row per connected wallet, created on first connect.
create table if not exists users (
  wallet text primary key,
  created_at timestamptz default now(),
  last_seen timestamptz default now(),
  games_played integer not null default 0,
  best_score integer not null default 0,
  best_distance integer not null default 0
);
alter table users enable row level security;
create policy "public read users" on users for select using (true);

-- Config key-value store
create table if not exists config (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Seed config
insert into config (key, value) values
  ('prize_pool_sol', '0'),
  ('next_draw_at', now() + interval '5 minutes'),
  ('current_round', '0')
on conflict (key) do nothing;

-- Enable RLS
alter table scores enable row level security;
alter table winners enable row level security;
alter table config enable row level security;

-- Public read access
create policy "public read scores" on scores for select using (true);
create policy "public read winners" on winners for select using (true);
create policy "public read config" on config for select using (true);

-- Scores are inserted ONLY by the server (service role, which bypasses RLS)
-- after anti-cheat validation in /api/score. Drop any legacy public-insert
-- policy so clients cannot write scores directly with the anon key.
drop policy if exists "public insert scores" on scores;
