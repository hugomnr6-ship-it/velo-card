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

-- ==========================================
-- Phase: Clubs
-- ==========================================

create table clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  logo_url    text,
  creator_id  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz default now()
);

create table club_members (
  id        uuid primary key default gen_random_uuid(),
  club_id   uuid not null references clubs(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique (club_id, user_id)
);

create index idx_club_members_club on club_members(club_id);
create index idx_club_members_user on club_members(user_id);
create index idx_clubs_name on clubs(name);

alter table clubs enable row level security;
alter table club_members enable row level security;

-- ==========================================
-- Phase: Squad Wars (Guerre des Pelotons)
-- ==========================================

-- 1. WARS — Weekly match between two clubs
create table wars (
  id            uuid primary key default gen_random_uuid(),
  week_label    text not null,                          -- e.g. "2026-W07"
  club_a_id     uuid not null references clubs(id) on delete cascade,
  club_b_id     uuid not null references clubs(id) on delete cascade,
  club_a_score  smallint not null default 0,            -- towers won (0-3)
  club_b_score  smallint not null default 0,
  status        text not null default 'active'
                check (status in ('active', 'finished')),
  starts_at     timestamptz not null,                   -- Tuesday 00:00 UTC
  ends_at       timestamptz not null,                   -- Sunday 23:59 UTC
  created_at    timestamptz default now(),
  unique (week_label, club_a_id),
  unique (week_label, club_b_id)
);

create index idx_wars_week on wars(week_label);
create index idx_wars_status on wars(status);

-- 2. WAR_TOWERS — Progress per tower per club (6 rows per war)
create table war_towers (
  id            uuid primary key default gen_random_uuid(),
  war_id        uuid not null references wars(id) on delete cascade,
  club_id       uuid not null references clubs(id) on delete cascade,
  tower_type    text not null check (tower_type in ('roi', 'montagne', 'sprint')),
  current_value real not null default 0,
  target_value  real not null,
  is_winner     boolean not null default false,
  unique (war_id, club_id, tower_type)
);

create index idx_war_towers_war on war_towers(war_id);

-- 3. WAR_CONTRIBUTIONS — Individual member contributions
create table war_contributions (
  id                    uuid primary key default gen_random_uuid(),
  war_id                uuid not null references wars(id) on delete cascade,
  club_id               uuid not null references clubs(id) on delete cascade,
  user_id               uuid not null references profiles(id) on delete cascade,
  km_contributed        real not null default 0,
  dplus_contributed     real not null default 0,
  sprints_contributed   int not null default 0,
  last_updated_at       timestamptz default now(),
  unique (war_id, club_id, user_id)
);

create index idx_war_contributions_war on war_contributions(war_id);

alter table wars enable row level security;
alter table war_towers enable row level security;
alter table war_contributions enable row level security;
