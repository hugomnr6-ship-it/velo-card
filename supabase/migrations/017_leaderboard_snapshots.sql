-- Leaderboard snapshots for monthly and yearly rankings

CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
  period_label TEXT NOT NULL,
  total_km NUMERIC NOT NULL DEFAULT 0,
  total_dplus NUMERIC NOT NULL DEFAULT 0,
  total_rides INTEGER NOT NULL DEFAULT 0,
  ovr_at_period INTEGER,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period_type, period_label)
);

CREATE INDEX idx_leaderboard_snapshots_period ON leaderboard_snapshots(period_type, period_label, total_km DESC);
