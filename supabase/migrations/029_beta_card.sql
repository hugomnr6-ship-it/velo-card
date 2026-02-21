-- Beta Tester special card — PROTOTYPE edition
-- Exclusive for first 50 beta testers. Never available again after beta ends.

-- Beta tester tracking table
CREATE TABLE beta_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  beta_number INTEGER NOT NULL UNIQUE CHECK (beta_number BETWEEN 1 AND 50),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_beta_testers_user ON beta_testers(user_id);
CREATE INDEX idx_beta_testers_number ON beta_testers(beta_number);

-- Beta card skin entry
INSERT INTO card_skins (id, name, description, preview_url, skin_type, rarity, unlock_method, cost_coins, is_active)
VALUES ('prototype', 'PROTOTYPE', 'Carte exclusive beta testeur. Monochrome, data rain, numérotée. Plus JAMAIS disponible après la beta.', NULL, 'full', 'legendary', 'achievement', 0, true)
ON CONFLICT (id) DO NOTHING;

-- Function to auto-enroll beta testers (call on signup during beta)
CREATE OR REPLACE FUNCTION enroll_beta_tester(p_user_id UUID)
RETURNS TABLE(beta_number INTEGER, already_enrolled BOOLEAN) AS $$
DECLARE
  v_existing INTEGER;
  v_next_number INTEGER;
BEGIN
  -- Check if already enrolled
  SELECT bt.beta_number INTO v_existing
  FROM beta_testers bt
  WHERE bt.user_id = p_user_id;

  IF v_existing IS NOT NULL THEN
    RETURN QUERY SELECT v_existing, true;
    RETURN;
  END IF;

  -- Get next available number
  SELECT COALESCE(MAX(bt.beta_number), 0) + 1 INTO v_next_number
  FROM beta_testers bt;

  -- Check if still room (max 50)
  IF v_next_number > 50 THEN
    RETURN QUERY SELECT 0, false;
    RETURN;
  END IF;

  -- Enroll
  INSERT INTO beta_testers (user_id, beta_number)
  VALUES (p_user_id, v_next_number);

  -- Give the skin automatically
  INSERT INTO user_inventory (user_id, item_id, obtained_from, is_active, equipped)
  VALUES (p_user_id, 'prototype', 'beta_reward', true, false)
  ON CONFLICT DO NOTHING;

  -- Log coin transaction (0 coins, just for the record)
  INSERT INTO coin_transactions (user_id, amount, reason, metadata)
  VALUES (p_user_id, 0, 'badge_earned', '{"type": "beta_tester", "beta_number": ' || v_next_number || '}');

  RETURN QUERY SELECT v_next_number, false;
END;
$$ LANGUAGE plpgsql;

-- Seed: enroll existing users in order of creation (first 50)
-- This automatically enrolls current users who signed up during beta
DO $$
DECLARE
  r RECORD;
  counter INTEGER := 0;
BEGIN
  FOR r IN
    SELECT id FROM profiles
    ORDER BY created_at ASC
    LIMIT 50
  LOOP
    counter := counter + 1;
    INSERT INTO beta_testers (user_id, beta_number)
    VALUES (r.id, counter)
    ON CONFLICT DO NOTHING;

    INSERT INTO user_inventory (user_id, item_id, obtained_from, is_active, equipped)
    VALUES (r.id, 'prototype', 'beta_reward', true, false)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
