-- Competitive seasons: 3-month cycles with rankings and rewards

CREATE TABLE seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished')),
  rewards JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE season_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id TEXT NOT NULL REFERENCES seasons(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season_points INTEGER NOT NULL DEFAULT 0,
  total_km NUMERIC DEFAULT 0,
  total_dplus NUMERIC DEFAULT 0,
  duels_won INTEGER DEFAULT 0,
  quests_completed INTEGER DEFAULT 0,
  races_podiums INTEGER DEFAULT 0,
  wars_won INTEGER DEFAULT 0,
  rank INTEGER,
  reward_claimed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season_id, user_id)
);

CREATE INDEX idx_season_rankings_season ON season_rankings(season_id, season_points DESC);

-- Seed first season
INSERT INTO seasons (id, name, starts_at, ends_at, status) VALUES
('S1-2026', 'Saison 1 — Printemps 2026', '2026-03-01T00:00:00Z', '2026-05-31T23:59:59Z', 'upcoming');
