-- Additional profile fields for editable profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_climb text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bike_name text DEFAULT '';
-- region already exists
