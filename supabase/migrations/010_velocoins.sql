-- VeloCoins: virtual currency system
-- Tables: user_coins, coin_transactions
-- RPC functions: increment_coins_earned, increment_coins_spent

CREATE TABLE user_coins (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_coin_transactions_user ON coin_transactions(user_id, created_at DESC);

-- RPC: atomically increment total_earned
CREATE OR REPLACE FUNCTION increment_coins_earned(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_coins
  SET total_earned = total_earned + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: atomically increment total_spent
CREATE OR REPLACE FUNCTION increment_coins_spent(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_coins
  SET total_spent = total_spent + p_amount, updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
