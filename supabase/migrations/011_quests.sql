-- Quests: daily & weekly micro-objectives

CREATE TABLE quest_definitions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly')),
  target_value NUMERIC NOT NULL,
  target_metric TEXT NOT NULL,
  coin_reward INTEGER NOT NULL DEFAULT 50,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  badge_reward TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL REFERENCES quest_definitions(id),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_value NUMERIC NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  coin_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quest_id, assigned_date)
);

CREATE INDEX idx_user_quests_active ON user_quests(user_id, assigned_date, is_completed);

-- Seed quest definitions
INSERT INTO quest_definitions (id, title, description, icon, quest_type, target_value, target_metric, coin_reward) VALUES
-- Daily
('daily_10km', 'Sortie Express', 'Roule 10 km aujourd''hui', '🚴', 'daily', 10, 'km', 30),
('daily_20km', 'Belle Balade', 'Roule 20 km aujourd''hui', '🛣️', 'daily', 20, 'km', 50),
('daily_200dplus', 'Grimpette', 'Fais 200m de D+ aujourd''hui', '⛰️', 'daily', 200, 'dplus', 40),
('daily_1ride', 'En Selle !', 'Fais au moins 1 sortie aujourd''hui', '✅', 'daily', 1, 'rides', 20),
-- Weekly
('weekly_100km', 'Centurion', 'Roule 100 km cette semaine', '💯', 'weekly', 100, 'km', 150),
('weekly_500dplus', 'Alpiniste', 'Cumule 500m de D+ cette semaine', '🏔️', 'weekly', 500, 'dplus', 120),
('weekly_3rides', 'Regulier', 'Fais 3 sorties cette semaine', '📅', 'weekly', 3, 'rides', 80),
('weekly_5rides', 'Machine', 'Fais 5 sorties cette semaine', '🔥', 'weekly', 5, 'rides', 200),
('weekly_win_duel', 'Gladiateur', 'Gagne 1 duel cette semaine', '⚔️', 'weekly', 1, 'duels_won', 100);
