-- Add country fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'France';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'FR';
