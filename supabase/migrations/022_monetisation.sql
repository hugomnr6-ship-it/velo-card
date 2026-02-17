-- =============================================
-- Table : stripe_customers
-- Lien user <-> customer Stripe
-- =============================================
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe ON stripe_customers(stripe_customer_id);

-- =============================================
-- Table : subscriptions
-- Abonnements Pro actifs
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'pro_monthly' CHECK (plan IN ('pro_monthly', 'pro_yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- =============================================
-- Table : payments
-- Historique de tous les paiements
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL, -- centimes
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  type TEXT NOT NULL CHECK (type IN ('subscription', 'coins_purchase', 'pack_purchase')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(type);

-- =============================================
-- Table : referrals
-- Système de parrainage
-- =============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id) -- un user ne peut être parrainé qu'une fois
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- =============================================
-- Ajouter colonnes aux profiles
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;

-- Générer un referral_code pour chaque user existant
UPDATE profiles SET referral_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8)) WHERE referral_code IS NULL;

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own stripe customer" ON stripe_customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Service role can do everything (for webhooks)
CREATE POLICY "Service can manage stripe_customers" ON stripe_customers FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service can manage subscriptions" ON subscriptions FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service can manage payments" ON payments FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service can manage referrals" ON referrals FOR ALL USING (TRUE) WITH CHECK (TRUE);
