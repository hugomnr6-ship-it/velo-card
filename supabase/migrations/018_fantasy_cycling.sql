-- Fantasy Cycling
-- Ligues fantasy
CREATE TABLE fantasy_leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  entry_fee INTEGER DEFAULT 0 CHECK (entry_fee >= 0),
  max_participants INTEGER DEFAULT 10 CHECK (max_participants BETWEEN 4 AND 20),
  duration_weeks INTEGER DEFAULT 4 CHECK (duration_weeks IN (4, 8)),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  prize_pool INTEGER DEFAULT 0,
  draft_budget INTEGER DEFAULT 1000,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  current_week INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participants
CREATE TABLE fantasy_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  rank INTEGER,
  transfers_remaining INTEGER DEFAULT 1,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league_id, user_id)
);

-- Equipes (cyclistes draftes)
CREATE TABLE fantasy_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES fantasy_participants(id) ON DELETE CASCADE,
  cyclist_id UUID REFERENCES profiles(id),
  is_captain BOOLEAN DEFAULT false,
  is_super_sub BOOLEAN DEFAULT false,
  draft_cost INTEGER NOT NULL,
  acquired_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_id, cyclist_id)
);

-- Scores hebdomadaires
CREATE TABLE fantasy_weekly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES fantasy_participants(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  total_score INTEGER DEFAULT 0,
  breakdown JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_id, week_number)
);

-- Transferts
CREATE TABLE fantasy_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES fantasy_participants(id) ON DELETE CASCADE,
  dropped_cyclist_id UUID REFERENCES profiles(id),
  picked_cyclist_id UUID REFERENCES profiles(id),
  week_number INTEGER NOT NULL,
  cost INTEGER DEFAULT 0,
  transferred_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_fantasy_leagues_status ON fantasy_leagues(status);
CREATE INDEX idx_fantasy_leagues_invite ON fantasy_leagues(invite_code);
CREATE INDEX idx_fantasy_participants_league ON fantasy_participants(league_id);
CREATE INDEX idx_fantasy_participants_user ON fantasy_participants(user_id);
CREATE INDEX idx_fantasy_teams_participant ON fantasy_teams(participant_id);
CREATE INDEX idx_fantasy_teams_cyclist ON fantasy_teams(cyclist_id);
CREATE INDEX idx_fantasy_weekly_scores_week ON fantasy_weekly_scores(participant_id, week_number);

-- Idempotency key for coin transactions
ALTER TABLE coin_transactions ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_transactions_idempotency
  ON coin_transactions(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
