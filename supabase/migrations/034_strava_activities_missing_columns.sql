-- Migration 034: Ajouter les colonnes manquantes à strava_activities
-- Ces colonnes sont requises par VeloCardSection et l'API sync pour sauvegarder
-- les activités Strava correctement. Sans elles, l'upsert échoue silencieusement
-- et aucune activité n'est enregistrée en base.

ALTER TABLE strava_activities
  ADD COLUMN IF NOT EXISTS elapsed_time int,
  ADD COLUMN IF NOT EXISTS max_speed real,
  ADD COLUMN IF NOT EXISTS weighted_average_watts real;

-- Index sur start_date pour les requêtes weekly/career du profil
CREATE INDEX IF NOT EXISTS idx_activities_start_date
  ON strava_activities(user_id, start_date);
