-- Table pour sauvegarder les parcours GPX analysés
CREATE TABLE saved_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gpx_url TEXT,
  distance_km NUMERIC(8,2) NOT NULL,
  elevation_gain INTEGER NOT NULL,
  rdi_score NUMERIC(3,1),
  climb_count INTEGER DEFAULT 0,
  center_lat NUMERIC(10,7),
  center_lng NUMERIC(10,7),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_saved_routes_user ON saved_routes(user_id);
