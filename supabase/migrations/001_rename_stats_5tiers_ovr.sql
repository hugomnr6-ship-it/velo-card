-- Migration: Rename stats columns + 5 tiers + OVR
-- grim → mon, tec → val, exp → spr, pui → res, add ovr

-- Rename columns
ALTER TABLE user_stats RENAME COLUMN grim TO mon;
ALTER TABLE user_stats RENAME COLUMN tec TO val;
ALTER TABLE user_stats RENAME COLUMN exp TO spr;
ALTER TABLE user_stats RENAME COLUMN pui TO res;

-- Add OVR column
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS ovr integer DEFAULT 0;

-- Migrate tier values
UPDATE user_stats SET tier = 'argent' WHERE tier = 'silver';
UPDATE user_stats SET tier = 'diamant' WHERE tier = 'gold';

-- Recalculate OVR for existing rows
UPDATE user_stats SET ovr = ROUND(
  pac * 0.15 +
  mon * 0.20 +
  val * 0.10 +
  spr * 0.10 +
  "end" * 0.15 +
  res * 0.30
);

-- Recalculate tiers based on new OVR
UPDATE user_stats SET tier = CASE
  WHEN ovr >= 90 THEN 'legende'
  WHEN ovr >= 80 THEN 'diamant'
  WHEN ovr >= 65 THEN 'platine'
  WHEN ovr >= 50 THEN 'argent'
  ELSE 'bronze'
END;
