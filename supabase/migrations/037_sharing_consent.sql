-- Migration: Add Strava data sharing consent
-- Description: Ajoute le consentement de partage pour la conformité Strava API ToS

-- 1. Ajouter les champs de consentement à profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sharing_consent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sharing_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS strava_deauth_at TIMESTAMPTZ;

-- 2. Index pour filtrer efficacement les users consentants
CREATE INDEX IF NOT EXISTS idx_profiles_sharing_consent
  ON profiles(sharing_consent) WHERE sharing_consent = true;

-- 3. Fonction de nettoyage des données Strava lors de la déconnexion
CREATE OR REPLACE FUNCTION cleanup_strava_data(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Supprimer les activités Strava brutes
  DELETE FROM strava_activities WHERE user_id = p_user_id;

  -- Révoquer le consentement
  UPDATE profiles
  SET sharing_consent = false,
      sharing_consent_at = NULL,
      strava_deauth_at = now()
  WHERE id = p_user_id;

  -- Retirer du feed les events qui exposent des données
  DELETE FROM activity_feed
  WHERE user_id = p_user_id
  AND event_type IN (
    'tier_up', 'race_result', 'race_podium',
    'duel_won', 'duel_lost', 'totw_selected', 'in_form_status'
  );

  -- Retirer du matchmaking
  DELETE FROM matchmaking_queue WHERE user_id = p_user_id;

  -- Retirer des daily duels non acceptés
  DELETE FROM daily_duels
  WHERE (user_id = p_user_id OR opponent_id = p_user_id)
  AND status = 'proposed';
END;
$$ LANGUAGE plpgsql;
