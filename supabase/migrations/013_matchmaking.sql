-- Matchmaking queue for automatic duel pairing
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  stake INTEGER NOT NULL,
  user_ovr INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Auto-cleanup: entries older than 24h should be deleted by cron
CREATE INDEX idx_matchmaking_queue_category ON matchmaking_queue(category, user_ovr);
