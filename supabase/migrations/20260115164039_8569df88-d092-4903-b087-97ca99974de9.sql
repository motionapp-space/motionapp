-- First create a generic update_updated_at function in public schema
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 1: Create product_type enum
CREATE TYPE product_type AS ENUM ('session_pack', 'single_session', 'subscription');

-- Step 2: Create products table (catalogo)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type product_type NOT NULL,
  credits_amount INTEGER NOT NULL DEFAULT 1,
  price_cents INTEGER NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_coach_id ON products(coach_id);
CREATE INDEX idx_products_active_visible ON products(coach_id, is_active, is_visible);

-- Trigger updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Step 3: Create coach_settings table (to preserve lock_window_hours)
CREATE TABLE coach_settings (
  coach_id UUID PRIMARY KEY REFERENCES coaches(id) ON DELETE CASCADE,
  lock_window_hours INTEGER NOT NULL DEFAULT 24,
  currency_code TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_coach_settings_updated_at
  BEFORE UPDATE ON coach_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS for coach_settings
ALTER TABLE coach_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can manage own settings"
  ON coach_settings FOR ALL
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Step 4: Migrate data from package_settings to products
INSERT INTO products (coach_id, name, type, credits_amount, price_cents, duration_months, sort_order)
SELECT 
  coach_id,
  'Lezione singola',
  'single_session'::product_type,
  1,
  sessions_1_price,
  sessions_1_duration,
  0
FROM package_settings
WHERE sessions_1_price IS NOT NULL

UNION ALL
SELECT 
  coach_id, 'Pacchetto 3 sessioni', 'session_pack'::product_type, 3,
  sessions_3_price, sessions_3_duration, 1
FROM package_settings
WHERE sessions_3_price IS NOT NULL

UNION ALL
SELECT 
  coach_id, 'Pacchetto 5 sessioni', 'session_pack'::product_type, 5,
  sessions_5_price, sessions_5_duration, 2
FROM package_settings
WHERE sessions_5_price IS NOT NULL

UNION ALL
SELECT 
  coach_id, 'Pacchetto 10 sessioni', 'session_pack'::product_type, 10,
  sessions_10_price, sessions_10_duration, 3
FROM package_settings
WHERE sessions_10_price IS NOT NULL

UNION ALL
SELECT 
  coach_id, 'Pacchetto 15 sessioni', 'session_pack'::product_type, 15,
  sessions_15_price, sessions_15_duration, 4
FROM package_settings
WHERE sessions_15_price IS NOT NULL

UNION ALL
SELECT 
  coach_id, 'Pacchetto 20 sessioni', 'session_pack'::product_type, 20,
  sessions_20_price, sessions_20_duration, 5
FROM package_settings
WHERE sessions_20_price IS NOT NULL;

-- Step 5: Migrate lock_window_hours to coach_settings
INSERT INTO coach_settings (coach_id, lock_window_hours, currency_code)
SELECT coach_id, lock_window_hours, currency_code
FROM package_settings;

-- Step 6: Add product_id to order_payments (preparing for rename)
ALTER TABLE order_payments 
  ADD COLUMN product_id UUID REFERENCES products(id);

-- Step 7: Rename order_payments to orders
ALTER TABLE order_payments RENAME TO orders;