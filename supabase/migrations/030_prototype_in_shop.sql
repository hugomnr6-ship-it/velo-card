-- Add PROTOTYPE skin to the active shop rotation
-- Price: 500 VeloCoins — exclusive GLITCH green neon design

-- Update prototype skin description to reflect new GLITCH design
UPDATE card_skins
SET description = 'Carte exclusive GLITCH. Neon vert hacker, CRT scanline, data rain, numérotée. Edition limitée beta.',
    cost_coins = 500
WHERE id = 'prototype';

-- Add prototype to current active rotation
INSERT INTO shop_rotation_items (rotation_id, skin_id, price_coins, is_featured, sort_order)
SELECT r.id, 'prototype', 500, false, 5
FROM shop_rotations r
WHERE r.is_active = true
  AND r.starts_at <= now()
  AND r.ends_at >= now()
ORDER BY r.starts_at DESC
LIMIT 1
ON CONFLICT DO NOTHING;
