-- Badge showcase: up to 3 featured badges on profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS showcase_badges TEXT[] DEFAULT '{}';
