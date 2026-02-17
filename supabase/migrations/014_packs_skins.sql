-- Packs, items, inventory, and skins

-- Pack definitions
CREATE TABLE pack_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  cost_coins INTEGER NOT NULL,
  items_count INTEGER NOT NULL DEFAULT 3,
  rarity_weights JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Items obtainable from packs
CREATE TABLE pack_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('stat_boost', 'skin', 'coins', 'badge')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  effect JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- User inventory
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES pack_items(id),
  obtained_from TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  equipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_inventory_user ON user_inventory(user_id, is_active);

-- Pack open history
CREATE TABLE pack_opens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL REFERENCES pack_definitions(id),
  items_received JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Card skins
CREATE TABLE card_skins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  preview_url TEXT,
  skin_type TEXT NOT NULL CHECK (skin_type IN ('border', 'background', 'effect', 'full')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlock_method TEXT NOT NULL CHECK (unlock_method IN ('pack', 'achievement', 'season', 'purchase')),
  cost_coins INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Equipped skin on profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_skin TEXT REFERENCES card_skins(id);

-- Seed pack definitions
INSERT INTO pack_definitions (id, name, description, icon, cost_coins, items_count, rarity_weights) VALUES
('bronze_pack', 'Pack Bronze', '3 items dont au moins 1 rare', '📦', 150, 3, '{"common": 60, "rare": 30, "epic": 8, "legendary": 2}'),
('silver_pack', 'Pack Argent', '3 items dont au moins 1 epic', '🥈', 300, 3, '{"common": 30, "rare": 40, "epic": 25, "legendary": 5}'),
('gold_pack', 'Pack Or', '5 items dont au moins 1 legendary', '🏆', 750, 5, '{"common": 10, "rare": 30, "epic": 40, "legendary": 20}');

-- Seed pack items
INSERT INTO pack_items (id, name, description, icon, item_type, rarity, effect) VALUES
-- Stat boosts
('boost_pac_3', '+3 PAC', '+3 vitesse pendant 1 semaine', '💨', 'stat_boost', 'common', '{"stat": "pac", "boost": 3, "duration_weeks": 1}'),
('boost_end_3', '+3 END', '+3 endurance pendant 1 semaine', '🔋', 'stat_boost', 'common', '{"stat": "end", "boost": 3, "duration_weeks": 1}'),
('boost_mon_5', '+5 MON', '+5 montagne pendant 1 semaine', '⛰️', 'stat_boost', 'rare', '{"stat": "mon", "boost": 5, "duration_weeks": 1}'),
('boost_ovr_3', '+3 OVR', '+3 overall pendant 1 semaine', '⭐', 'stat_boost', 'epic', '{"stat": "ovr", "boost": 3, "duration_weeks": 1}'),
-- Coins
('coins_50', '50 VeloCoins', 'Bonus de 50 coins', '🪙', 'coins', 'common', '{"coins": 50}'),
('coins_200', '200 VeloCoins', 'Bonus de 200 coins', '💰', 'coins', 'rare', '{"coins": 200}'),
('coins_500', '500 VeloCoins', 'Jackpot de 500 coins', '🤑', 'coins', 'epic', '{"coins": 500}'),
-- Skins (permanent)
('skin_neon', 'Neon', 'Border neon pour ta carte', '💜', 'skin', 'rare', '{"skin_id": "neon", "type": "border"}'),
('skin_flames', 'Flammes', 'Effet flammes sur ta carte', '🔥', 'skin', 'epic', '{"skin_id": "flames", "type": "effect"}'),
('skin_holographic', 'Holographique', 'Effet holographique complet', '🌈', 'skin', 'legendary', '{"skin_id": "holographic", "type": "full"}'),
('skin_gold_border', 'Or Massif', 'Border en or massif', '👑', 'skin', 'legendary', '{"skin_id": "gold_border", "type": "border"}');

-- Seed card skins
INSERT INTO card_skins (id, name, description, skin_type, rarity, unlock_method) VALUES
('neon', 'Neon', 'Border neon lumineux', 'border', 'rare', 'pack'),
('flames', 'Flammes', 'Effet flammes dynamique', 'effect', 'epic', 'pack'),
('holographic', 'Holographique', 'Effet holographique complet', 'full', 'legendary', 'pack'),
('gold_border', 'Or Massif', 'Border dore premium', 'border', 'legendary', 'pack');
