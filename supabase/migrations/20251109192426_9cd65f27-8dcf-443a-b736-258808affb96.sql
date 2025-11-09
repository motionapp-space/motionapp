-- Add duration_months to package table
ALTER TABLE package 
ADD COLUMN IF NOT EXISTS duration_months INTEGER;

-- Set default duration based on existing packages (3 months default)
UPDATE package 
SET duration_months = 3 
WHERE duration_months IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE package 
ALTER COLUMN duration_months SET NOT NULL;

-- Add check constraint for valid durations (1, 3, 6, 12 months)
ALTER TABLE package 
ADD CONSTRAINT check_duration_months 
CHECK (duration_months IN (1, 3, 6, 12));

-- Add similar duration field to package_settings with defaults
ALTER TABLE package_settings
ADD COLUMN IF NOT EXISTS sessions_1_duration INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sessions_5_duration INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS sessions_10_duration INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS sessions_20_duration INTEGER DEFAULT 12;

-- Update existing settings with defaults if NULL
UPDATE package_settings
SET 
  sessions_1_duration = COALESCE(sessions_1_duration, 1),
  sessions_5_duration = COALESCE(sessions_5_duration, 3),
  sessions_10_duration = COALESCE(sessions_10_duration, 6),
  sessions_20_duration = COALESCE(sessions_20_duration, 12);

-- Make duration fields NOT NULL
ALTER TABLE package_settings
ALTER COLUMN sessions_1_duration SET NOT NULL,
ALTER COLUMN sessions_5_duration SET NOT NULL,
ALTER COLUMN sessions_10_duration SET NOT NULL,
ALTER COLUMN sessions_20_duration SET NOT NULL;

-- Add check constraints for valid durations in settings
ALTER TABLE package_settings
ADD CONSTRAINT check_sessions_1_duration CHECK (sessions_1_duration IN (1, 3, 6, 12)),
ADD CONSTRAINT check_sessions_5_duration CHECK (sessions_5_duration IN (1, 3, 6, 12)),
ADD CONSTRAINT check_sessions_10_duration CHECK (sessions_10_duration IN (1, 3, 6, 12)),
ADD CONSTRAINT check_sessions_20_duration CHECK (sessions_20_duration IN (1, 3, 6, 12));

-- Update existing expires_at to be calculated from created_at + duration_months
-- Only for packages where expires_at is close to the default 3 months
UPDATE package
SET expires_at = created_at + (duration_months || ' months')::INTERVAL
WHERE duration_months IS NOT NULL;

-- Add PRICE_UPDATE to ledger_type enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'ledger_type' AND e.enumlabel = 'PRICE_UPDATE'
  ) THEN
    ALTER TYPE ledger_type ADD VALUE 'PRICE_UPDATE';
  END IF;
END $$;

-- Create function to check if package is expired and auto-suspend
CREATE OR REPLACE FUNCTION check_package_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- If package is expired and not already archived, set to suspended
  IF NEW.expires_at <= now() 
     AND NEW.usage_status NOT IN ('archived', 'completed') THEN
    NEW.usage_status := 'suspended';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for expiration check on UPDATE
DROP TRIGGER IF EXISTS trigger_check_package_expiration ON package;
CREATE TRIGGER trigger_check_package_expiration
  BEFORE UPDATE ON package
  FOR EACH ROW
  EXECUTE FUNCTION check_package_expiration();

-- Add comment explaining the duration system
COMMENT ON COLUMN package.duration_months IS 'Duration in months (1, 3, 6, or 12). Combined with created_at determines expires_at. Immutable after creation.';
COMMENT ON COLUMN package.expires_at IS 'Expiration date calculated as created_at + duration_months. When reached, package auto-suspends.';