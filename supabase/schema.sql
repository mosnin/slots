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

-- Current round leaderboard view (top score per wallet since last draw)
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

-- Winners history
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

-- Anyone can insert scores (validated server-side)
create policy "public insert scores" on scores for insert with check (true);
