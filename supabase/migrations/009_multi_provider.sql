-- Multi-provider support: Garmin + Wahoo alongside Strava
-- Adds provider-specific ID columns and a provider field

-- Add provider columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'strava',
  ADD COLUMN IF NOT EXISTS garmin_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS wahoo_id bigint UNIQUE;

-- Index for fast lookups by provider ID
CREATE INDEX IF NOT EXISTS idx_profiles_garmin_id ON profiles (garmin_id) WHERE garmin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_wahoo_id ON profiles (wahoo_id) WHERE wahoo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON profiles (provider);

-- Update RLS: no changes needed since we lookup by profiles.id everywhere after auth
