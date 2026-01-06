-- Add columns for 3-session and 15-session packages with 10% fixed discount
ALTER TABLE package_settings
ADD COLUMN IF NOT EXISTS sessions_3_price integer NOT NULL DEFAULT 13500,
ADD COLUMN IF NOT EXISTS sessions_3_duration integer NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS sessions_15_price integer NOT NULL DEFAULT 67500,
ADD COLUMN IF NOT EXISTS sessions_15_duration integer NOT NULL DEFAULT 9;

-- Comment: defaults calculated with 10% fixed discount
-- sessions_3_price = 4500 * 3 = 13500 (135€)
-- sessions_15_price = 4500 * 15 = 67500 (675€)
-- Durations: linear pattern (2, 3, 6, 9, 12 months)