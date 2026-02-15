-- Migration 008: Enrich races table for FFC calendar + full race features
-- Adds federation, category, gender, distance, elevation, GPX, weather, etc.

-- Make creator_id nullable (official/imported races have no creator)
ALTER TABLE races ALTER COLUMN creator_id DROP NOT NULL;

-- Add new columns
ALTER TABLE races ADD COLUMN IF NOT EXISTS federation text DEFAULT 'OTHER';
ALTER TABLE races ADD COLUMN IF NOT EXISTS category text DEFAULT 'Seniors';
ALTER TABLE races ADD COLUMN IF NOT EXISTS gender text DEFAULT 'MIXTE';
ALTER TABLE races ADD COLUMN IF NOT EXISTS distance_km numeric(6,1);
ALTER TABLE races ADD COLUMN IF NOT EXISTS elevation_gain int;
ALTER TABLE races ADD COLUMN IF NOT EXISTS rdi_score numeric(4,1);
ALTER TABLE races ADD COLUMN IF NOT EXISTS is_official boolean DEFAULT false;
ALTER TABLE races ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE races ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE races ADD COLUMN IF NOT EXISTS gpx_data jsonb;
ALTER TABLE races ADD COLUMN IF NOT EXISTS weather_cache jsonb;
ALTER TABLE races ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE races ADD COLUMN IF NOT EXISTS status text DEFAULT 'upcoming';

-- Create unique constraint for upsert (import dedup)
ALTER TABLE races ADD CONSTRAINT races_name_date_unique UNIQUE (name, date);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_races_federation ON races(federation);
CREATE INDEX IF NOT EXISTS idx_races_region ON races(region);
CREATE INDEX IF NOT EXISTS idx_races_department ON races(department);
CREATE INDEX IF NOT EXISTS idx_races_status ON races(status);

-- RLS: allow anyone to read races
CREATE POLICY IF NOT EXISTS "Races are viewable by everyone"
  ON races FOR SELECT USING (true);

-- RLS: allow authenticated users to insert races
CREATE POLICY IF NOT EXISTS "Authenticated users can create races"
  ON races FOR INSERT WITH CHECK (true);

-- RLS: allow creators to update their own races
CREATE POLICY IF NOT EXISTS "Creators can update their races"
  ON races FOR UPDATE USING (
    creator_id IS NULL OR creator_id = auth.uid()
  );

-- Create race_points table for scoring system
CREATE TABLE IF NOT EXISTS race_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  position int,
  total_participants int,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, race_id)
);

ALTER TABLE race_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Race points viewable by everyone"
  ON race_points FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Race points insertable by system"
  ON race_points FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_race_points_user ON race_points(user_id);
CREATE INDEX IF NOT EXISTS idx_race_points_race ON race_points(race_id);
