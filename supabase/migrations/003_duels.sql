-- ==========================================
-- VeloCard Phase 2 — Duels Head-to-Head
-- ==========================================

-- 1. DUELS — 1v1 challenges between two riders
create table duels (
  id              uuid primary key default gen_random_uuid(),

  -- Players
  challenger_id   uuid not null references profiles(id) on delete cascade,
  opponent_id     uuid not null references profiles(id) on delete cascade,

  -- Challenge config
  category        text not null check (category in (
    'ovr', 'pac', 'mon', 'val', 'spr', 'end', 'res',     -- stat duels (compare card stats)
    'weekly_km', 'weekly_dplus', 'weekly_rides'            -- activity duels (weekly performance)
  )),
  duel_type       text not null default 'instant' check (duel_type in (
    'instant',    -- Compare current stats immediately
    'weekly'      -- Compare weekly performance (Mon-Sun)
  )),

  -- Stakes (ego points)
  stake           smallint not null default 10 check (stake between 5 and 100),

  -- Status flow: pending → accepted → resolved / declined / expired
  status          text not null default 'pending' check (status in (
    'pending',    -- Waiting for opponent to accept
    'accepted',   -- In progress (for weekly duels)
    'resolved',   -- Winner determined
    'declined',   -- Opponent refused
    'expired'     -- Not accepted within 48h
  )),

  -- Results
  challenger_value  real,     -- Final stat/performance value
  opponent_value    real,     -- Final stat/performance value
  winner_id         uuid references profiles(id) on delete set null,
  is_draw           boolean default false,

  -- Week tracking (for weekly duels)
  week_label        text,     -- e.g. "2026-W07"

  -- Timestamps
  created_at      timestamptz default now(),
  accepted_at     timestamptz,
  resolved_at     timestamptz,
  expires_at      timestamptz default (now() + interval '48 hours'),

  -- Constraints
  check (challenger_id != opponent_id)
);

create index idx_duels_challenger on duels(challenger_id);
create index idx_duels_opponent on duels(opponent_id);
create index idx_duels_status on duels(status);
create index idx_duels_week on duels(week_label);

alter table duels enable row level security;

-- 2. DUEL_HISTORY — Aggregate stats per user
-- (Can be computed from duels table, but this view helps with quick lookups)
create or replace view duel_stats as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  coalesce(sum(case when d.winner_id = p.id then 1 else 0 end), 0) as wins,
  coalesce(sum(case when d.winner_id is not null and d.winner_id != p.id and d.is_draw = false then 1 else 0 end), 0) as losses,
  coalesce(sum(case when d.is_draw = true then 1 else 0 end), 0) as draws,
  coalesce(sum(case when d.winner_id = p.id then d.stake else 0 end), 0)
    - coalesce(sum(case when d.winner_id is not null and d.winner_id != p.id and d.is_draw = false then d.stake else 0 end), 0) as ego_points
from profiles p
left join duels d on (d.challenger_id = p.id or d.opponent_id = p.id) and d.status = 'resolved'
group by p.id, p.username, p.avatar_url;

-- 3. Add ego_points column to user_stats for quick access
alter table user_stats add column if not exists ego_points integer default 0;

-- 4. RPC function to safely increment ego points
create or replace function increment_ego_points(uid uuid, pts integer)
returns void as $$
begin
  update user_stats
  set ego_points = coalesce(ego_points, 0) + pts
  where user_id = uid;
end;
$$ language plpgsql security definer;
