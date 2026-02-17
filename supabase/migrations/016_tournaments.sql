-- Tournaments with brackets and elimination

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tournament_type TEXT NOT NULL CHECK (tournament_type IN ('regional', 'national', 'custom')),
  region TEXT,
  category TEXT NOT NULL DEFAULT 'ovr',
  max_participants INTEGER DEFAULT 32,
  entry_cost_coins INTEGER DEFAULT 100,
  prize_pool_coins INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'registration' CHECK (status IN ('registration', 'active', 'finished', 'cancelled')),
  registration_ends_at TIMESTAMPTZ NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seed INTEGER,
  is_eliminated BOOLEAN DEFAULT false,
  final_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player_a_id UUID REFERENCES profiles(id),
  player_b_id UUID REFERENCES profiles(id),
  winner_id UUID REFERENCES profiles(id),
  player_a_value NUMERIC,
  player_b_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'finished', 'bye')),
  resolved_at TIMESTAMPTZ,
  UNIQUE(tournament_id, round, match_number)
);
