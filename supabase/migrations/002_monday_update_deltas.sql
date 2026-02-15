-- ==========================================
-- Migration 002: Monday Update — Deltas & History
-- ==========================================

-- 1. Ajouter les colonnes "previous" sur user_stats pour tracker les deltas
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS prev_pac smallint DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS prev_end smallint DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS prev_mon smallint DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS prev_res smallint DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS prev_spr smallint DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS prev_val smallint DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS prev_ovr smallint DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS prev_tier text DEFAULT 'bronze';

-- Date de dernière activité Strava (pour détecter l'inactivité)
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS last_activity_date timestamptz;

-- Compteur de semaines consécutives actives (streak)
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS active_weeks_streak int DEFAULT 0;

-- Flag "carte spéciale" de la semaine
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS special_card text DEFAULT NULL;
-- Valeurs possibles: 'totw', 'in_form', 'legend_moment', NULL

-- 2. Table d'historique hebdomadaire (une ligne par user par semaine)
CREATE TABLE IF NOT EXISTS stats_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_label  text NOT NULL,           -- e.g. "2026-W07"
  pac         smallint NOT NULL DEFAULT 0,
  "end"       smallint NOT NULL DEFAULT 0,
  mon         smallint NOT NULL DEFAULT 0,
  res         smallint NOT NULL DEFAULT 0,
  spr         smallint NOT NULL DEFAULT 0,
  val         smallint NOT NULL DEFAULT 0,
  ovr         smallint NOT NULL DEFAULT 0,
  tier        text NOT NULL DEFAULT 'bronze',
  special_card text DEFAULT NULL,
  weekly_km   real DEFAULT 0,          -- km roulés cette semaine
  weekly_dplus real DEFAULT 0,         -- D+ cette semaine
  weekly_rides int DEFAULT 0,          -- nb sorties cette semaine
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, week_label)
);

CREATE INDEX IF NOT EXISTS idx_stats_history_user ON stats_history(user_id);
CREATE INDEX IF NOT EXISTS idx_stats_history_week ON stats_history(week_label);

ALTER TABLE stats_history ENABLE ROW LEVEL SECURITY;

-- 3. Table TOTW (Team of the Week) — les meilleurs de chaque semaine
CREATE TABLE IF NOT EXISTS team_of_the_week (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_label  text NOT NULL,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category    text NOT NULL CHECK (category IN ('ovr', 'pac', 'mon', 'spr', 'end', 'res', 'val', 'progression')),
  stat_value  smallint NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (week_label, category)
);

CREATE INDEX IF NOT EXISTS idx_totw_week ON team_of_the_week(week_label);

ALTER TABLE team_of_the_week ENABLE ROW LEVEL SECURITY;

-- 4. Initialiser les prev_ avec les valeurs actuelles (pour la première migration)
UPDATE user_stats SET
  prev_pac = pac,
  prev_end = "end",
  prev_mon = mon,
  prev_res = res,
  prev_spr = spr,
  prev_val = val,
  prev_ovr = ovr,
  prev_tier = tier
WHERE prev_ovr = 0 AND ovr > 0;
