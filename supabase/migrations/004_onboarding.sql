-- Add has_onboarded flag to user_stats
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS has_onboarded boolean DEFAULT false;

-- Existing users with stats are considered onboarded
UPDATE user_stats SET has_onboarded = true WHERE ovr > 0;
