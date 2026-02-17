-- ══════════════════════════════════════
-- Vue matérialisée pour le leaderboard
-- Remplace l'agrégation JS côté serveur
-- Rafraîchie par le CRON monday-update
-- ══════════════════════════════════════

-- Vue matérialisée avec agrégation SQL
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_weekly AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar_url,
  p.region,
  us.pac,
  us.mon,
  us.tec,
  us.spr,
  us."end" AS endurance,
  us.val,
  us.res,
  us.pui,
  us.ovr,
  us.tier,
  COALESCE(SUM(sa.distance) / 1000, 0)::numeric(10,1) AS weekly_km,
  COALESCE(SUM(sa.total_elevation_gain), 0)::integer AS weekly_dplus,
  COUNT(sa.id)::integer AS weekly_rides
FROM profiles p
LEFT JOIN user_stats us ON us.user_id = p.id
LEFT JOIN strava_activities sa ON sa.user_id = p.id
  AND sa.start_date >= date_trunc('week', NOW())
  AND sa.activity_type = 'Ride'
GROUP BY p.id, p.username, p.avatar_url, p.region,
  us.pac, us.mon, us.tec, us.spr, us."end", us.val, us.res, us.pui, us.ovr, us.tier
WITH DATA;

-- Unique index nécessaire pour REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_weekly_user ON leaderboard_weekly (user_id);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_region ON leaderboard_weekly (region);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_ovr ON leaderboard_weekly (ovr DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_km ON leaderboard_weekly (weekly_km DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_dplus ON leaderboard_weekly (weekly_dplus DESC);

-- Fonction pour rafraîchir (appelée par le CRON)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_weekly;
END;
$$ LANGUAGE plpgsql;

-- Fonction RPC pour compter les membres par club (évite N+1)
CREATE OR REPLACE FUNCTION get_club_member_counts(club_ids UUID[])
RETURNS TABLE(club_id UUID, member_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT cm.club_id, COUNT(*)::BIGINT
  FROM club_members cm
  WHERE cm.club_id = ANY(club_ids)
  GROUP BY cm.club_id;
END;
$$ LANGUAGE plpgsql;
