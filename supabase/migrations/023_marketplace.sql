-- Marketplace listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('skin', 'boost', 'badge_frame')),
  item_id TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 10 AND price <= 10000),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  buyer_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  sold_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_type ON marketplace_listings(item_type, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_expires ON marketplace_listings(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_marketplace_price ON marketplace_listings(price) WHERE status = 'active';

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active listings" ON marketplace_listings
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid() OR buyer_id = auth.uid());
CREATE POLICY "Service can manage listings" ON marketplace_listings
  FOR ALL USING (TRUE) WITH CHECK (TRUE);
