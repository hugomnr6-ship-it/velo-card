-- ==========================================
-- VeloCard Phase 1 — Supabase Schema
-- ==========================================

-- 1. PROFILES — One row per user (linked to Strava)
create table profiles (
  id          uuid primary key default gen_random_uuid(),
  strava_id   bigint unique not null,
  username    text not null,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- 2. USER_STATS — Computed stats for the card
create table user_stats (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique not null references profiles(id) on delete cascade,
  pac             smallint not null default 0,   -- 0-99
  "end"           smallint not null default 0,   -- 0-99 (quoted: reserved word)
  grim            smallint not null default 0,   -- 0-99
  tier            text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold')),
  last_synced_at  timestamptz default now()
);

-- 3. STRAVA_ACTIVITIES — Raw cache of fetched activities
create table strava_activities (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  strava_activity_id    bigint not null,
  name                  text,
  distance              real not null,              -- meters
  moving_time           int not null,               -- seconds
  total_elevation_gain  real not null,              -- meters
  average_speed         real not null,              -- m/s
  start_date            timestamptz not null,
  activity_type         text not null,
  fetched_at            timestamptz default now(),
  unique (user_id, strava_activity_id)
);

-- Indexes
create index idx_activities_user on strava_activities(user_id);
create index idx_stats_user on user_stats(user_id);

-- RLS (Row Level Security) — enable on all tables
alter table profiles enable row level security;
alter table user_stats enable row level security;
alter table strava_activities enable row level security;
