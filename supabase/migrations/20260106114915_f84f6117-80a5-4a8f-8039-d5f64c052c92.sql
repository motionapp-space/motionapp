-- Update existing package_settings to apply 10% fixed discount on 10 and 20 session packages
UPDATE package_settings
SET 
  sessions_10_price = 45000,  -- 450€ (45€/session = 10% discount)
  sessions_20_price = 90000;  -- 900€ (45€/session = 10% discount)

-- Update column defaults for new records
ALTER TABLE package_settings 
  ALTER COLUMN sessions_10_price SET DEFAULT 45000,
  ALTER COLUMN sessions_20_price SET DEFAULT 90000;