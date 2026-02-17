-- ══════════════════════════════════════
-- INDEX DE PERFORMANCE — VeloCard
-- Migration 019 — Scalability optimization
-- ══════════════════════════════════════

-- 1. Leaderboard : filtrage par région + tri par OVR
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles (region);
CREATE INDEX IF NOT EXISTS idx_user_stats_ovr ON user_stats (ovr DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_ovr ON user_stats (user_id, ovr DESC);

-- 2. Activités : requête par user + semaine (Monday Update + Dashboard)
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON strava_activities (user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_date ON strava_activities (start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_type_date ON strava_activities (user_id, activity_type, start_date DESC);

-- 3. Stats History : lookup par user + semaine
CREATE INDEX IF NOT EXISTS idx_stats_history_user_week ON stats_history (user_id, week_label DESC);
CREATE INDEX IF NOT EXISTS idx_stats_history_week ON stats_history (week_label);

-- 4. Leaderboard Snapshots : requêtes périodiques
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_period ON leaderboard_snapshots (period_type, period_label);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_user ON leaderboard_snapshots (user_id, period_type, period_label);

-- 5. Duels : matchmaking + listing
CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels (challenger_id, status);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duels (opponent_id, status);
CREATE INDEX IF NOT EXISTS idx_duels_status_created ON duels (status, created_at DESC);

-- 6. Race Results : classement + historique par user
CREATE INDEX IF NOT EXISTS idx_race_results_user ON race_results (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_race_results_race ON race_results (race_id, position ASC);

-- 7. Club Members : listing + count
CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members (user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_role ON club_members (club_id, role);

-- 8. Wars : requêtes par semaine + club
CREATE INDEX IF NOT EXISTS idx_wars_week_status ON wars (week_label, status);
CREATE INDEX IF NOT EXISTS idx_wars_clubs ON wars (club_a_id, club_b_id, status);

-- 9. War Contributions : agrégation par guerre
CREATE INDEX IF NOT EXISTS idx_war_contributions_war ON war_contributions (war_id, user_id);

-- 10. Feed : timeline par user
CREATE INDEX IF NOT EXISTS idx_feed_user_created ON activity_feed (user_id, created_at DESC);

-- 11. Coins : historique par user
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions (user_id, created_at DESC);

-- 12. Quests : quêtes actives par user
CREATE INDEX IF NOT EXISTS idx_quests_user_status ON user_quests (user_id, status);

-- 13. Races : listing par date
CREATE INDEX IF NOT EXISTS idx_races_date_status ON races (date, status);
CREATE INDEX IF NOT EXISTS idx_race_entries_user ON race_entries (user_id, race_id);

-- 14. Badges : collection par user
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges (user_id, earned_at DESC);

-- 15. Fantasy : leagues et participants
CREATE INDEX IF NOT EXISTS idx_fantasy_participants_user ON fantasy_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_leagues_status ON fantasy_leagues (status, created_at DESC);

-- 16. Inventory : items par user
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory (user_id, item_type);

-- 17. Seasons : lookup rapide
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons (status, start_date DESC);

-- ══════════════════════════════════════
-- ANALYSE pour mettre à jour les statistiques du query planner
-- ══════════════════════════════════════
ANALYZE profiles;
ANALYZE user_stats;
ANALYZE strava_activities;
ANALYZE stats_history;
ANALYZE duels;
ANALYZE race_results;
ANALYZE club_members;
ANALYZE wars;
ANALYZE activity_feed;
ANALYZE races;
