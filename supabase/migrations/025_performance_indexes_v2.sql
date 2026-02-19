-- Composite indexes for frequent queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_tier_ovr
  ON user_stats(tier, ovr DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_user_date
  ON strava_activities(user_id, start_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_duels_status_created
  ON duels(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feed_created
  ON activity_feed(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_price_active
  ON marketplace_listings(price) WHERE status = 'active';

-- Partial index for active users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_active
  ON profiles(id) WHERE last_active_at > now() - INTERVAL '30 days';
