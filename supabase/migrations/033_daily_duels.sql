-- Duel du Jour : matchmaking automatique quotidien
CREATE TABLE daily_duels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  duel_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duel_id UUID REFERENCES duels(id) ON DELETE SET NULL, -- lien vers le duel créé si accepté
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, duel_date)
);

CREATE INDEX idx_daily_duels_user_date ON daily_duels(user_id, duel_date);
