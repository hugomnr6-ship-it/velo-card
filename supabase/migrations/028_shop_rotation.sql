-- Shop rotation system (replaces packs for direct skin purchase)

-- Table des rotations du shop
CREATE TABLE shop_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shop_rotation_active ON shop_rotations(starts_at, ends_at) WHERE is_active = true;

-- Items en vente dans chaque rotation
CREATE TABLE shop_rotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_id UUID NOT NULL REFERENCES shop_rotations(id) ON DELETE CASCADE,
  skin_id TEXT NOT NULL REFERENCES card_skins(id),
  price_coins INTEGER NOT NULL CHECK (price_coins > 0),
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_shop_items_rotation ON shop_rotation_items(rotation_id);

-- Historique des achats directs
CREATE TABLE skin_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skin_id TEXT NOT NULL REFERENCES card_skins(id),
  price_paid INTEGER NOT NULL,
  rotation_id UUID REFERENCES shop_rotations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_skin_purchases_user ON skin_purchases(user_id, created_at DESC);

-- Ajouter cost_coins aux skins existantes si pas déjà défini
UPDATE card_skins SET cost_coins = 400, unlock_method = 'purchase' WHERE id = 'neon';
UPDATE card_skins SET cost_coins = 800, unlock_method = 'purchase' WHERE id = 'flames';
UPDATE card_skins SET cost_coins = 1500, unlock_method = 'purchase' WHERE id = 'holographic';
UPDATE card_skins SET cost_coins = 1200, unlock_method = 'purchase' WHERE id = 'gold_border';

-- Ajouter de nouveaux skins pour le shop
INSERT INTO card_skins (id, name, description, skin_type, rarity, unlock_method, cost_coins, is_active) VALUES
('carbon', 'Carbone', 'Texture carbone racing', 'background', 'rare', 'purchase', 500, true),
('glacier', 'Glacier', 'Effet glacé bleuté', 'effect', 'epic', 'purchase', 900, true),
('aurora', 'Aurore Boréale', 'Reflets aurore animés', 'full', 'legendary', 'purchase', 2000, true),
('maillot_jaune', 'Maillot Jaune', 'Le graal du cyclisme', 'full', 'legendary', 'purchase', 2500, true)
ON CONFLICT (id) DO NOTHING;

-- Seed première rotation (semaine courante)
INSERT INTO shop_rotations (id, starts_at, ends_at)
VALUES ('00000000-0000-0000-0000-000000000001', date_trunc('week', now()), date_trunc('week', now()) + interval '7 days');

INSERT INTO shop_rotation_items (rotation_id, skin_id, price_coins, is_featured, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'maillot_jaune', 2500, true, 0),
('00000000-0000-0000-0000-000000000001', 'carbon', 500, false, 1),
('00000000-0000-0000-0000-000000000001', 'flames', 800, false, 2),
('00000000-0000-0000-0000-000000000001', 'glacier', 900, false, 3);

-- Désactiver les packs (ne pas supprimer pour garder l'historique)
UPDATE pack_definitions SET is_active = false;

-- RLS
ALTER TABLE shop_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_rotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE skin_purchases ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_role_all" ON shop_rotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON shop_rotation_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON skin_purchases FOR ALL USING (true) WITH CHECK (true);
