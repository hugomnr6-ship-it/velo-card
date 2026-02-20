-- ==========================================
-- Migration 026: Race Startlist (Liste des engagés)
-- ==========================================

CREATE TABLE IF NOT EXISTS race_engages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id     uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  rider_name  text NOT NULL,
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  bib_number  smallint,
  club        text,
  category    text,
  added_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (race_id, rider_name)
);

CREATE INDEX IF NOT EXISTS idx_race_engages_race ON race_engages(race_id);
CREATE INDEX IF NOT EXISTS idx_race_engages_user ON race_engages(user_id);

ALTER TABLE race_engages ENABLE ROW LEVEL SECURITY;
