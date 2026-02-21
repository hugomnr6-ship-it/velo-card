-- Migration: Ajout de quêtes contextuelles (engagement-driven)
-- Les quêtes passives ("roule X km") sont remplacées par des quêtes
-- qui poussent l'utilisateur à interagir avec les features de l'app.

-- Désactiver les quêtes daily purement passives
UPDATE quest_definitions SET is_active = false WHERE id IN (
  'daily_10km',
  'daily_20km',
  'daily_200dplus'
);

-- Nouvelles quêtes contextuelles daily
INSERT INTO quest_definitions (id, title, description, icon, quest_type, target_value, target_metric, coin_reward) VALUES
('daily_check_leaderboard', 'Espion du Peloton', 'Consulte le leaderboard', '🏆', 'daily', 1, 'leaderboard_view', 20),
('daily_duel_challenge', 'Provocateur', 'Lance un duel contre quelqu''un', '⚔️', 'daily', 1, 'duel_created', 30),
('daily_visit_shop', 'Lèche-Vitrine', 'Visite la boutique', '🛍️', 'daily', 1, 'shop_view', 20),
('daily_check_card', 'Narcissique', 'Consulte ta carte VeloCard', '🃏', 'daily', 1, 'card_view', 20),
('daily_view_profile', 'Stalker Amical', 'Consulte le profil d''un autre cycliste', '👀', 'daily', 1, 'profile_view', 20),
('daily_1ride', 'En Selle !', 'Fais au moins 1 sortie aujourd''hui', '✅', 'daily', 1, 'rides', 30)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  coin_reward = EXCLUDED.coin_reward,
  is_active = true;

-- Nouvelles quêtes contextuelles weekly
INSERT INTO quest_definitions (id, title, description, icon, quest_type, target_value, target_metric, coin_reward) VALUES
('weekly_duel_club', 'Rivalité Interne', 'Défie un membre de ton club', '🏴', 'weekly', 1, 'duel_club_member', 80),
('weekly_compare_card', 'Comparaison', 'Compare ta carte avec un autre cycliste', '📊', 'weekly', 1, 'card_compare', 50),
('weekly_50km', 'Semi-Centurion', 'Roule 50 km cette semaine', '🚴', 'weekly', 50, 'km', 80),
('weekly_badge_check', 'Collectionneur', 'Consulte tes badges', '🎖️', 'weekly', 1, 'badges_view', 30)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  coin_reward = EXCLUDED.coin_reward,
  is_active = true;
