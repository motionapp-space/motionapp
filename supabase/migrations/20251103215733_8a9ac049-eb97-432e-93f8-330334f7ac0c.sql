-- =====================================================
-- Session Packages Management Schema
-- =====================================================
-- Creates tables for managing client session packages with:
-- - Usage tracking (active/completed/suspended/archived)
-- - Payment tracking (unpaid/partial/paid/refunded)
-- - Hold mechanism for confirmed calendar events
-- - Complete audit trail via ledger

-- Usage status enum
CREATE TYPE package_usage_status AS ENUM ('active','completed','suspended','archived');

-- Payment status enum
CREATE TYPE package_payment_status AS ENUM ('unpaid','partial','paid','refunded');

-- Main package table
CREATE TABLE package (
  package_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id             UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  total_sessions       INT  NOT NULL CHECK (total_sessions IN (1,5,10,20) AND total_sessions > 0),
  consumed_sessions    INT  NOT NULL DEFAULT 0 CHECK (consumed_sessions >= 0),
  on_hold_sessions     INT  NOT NULL DEFAULT 0 CHECK (on_hold_sessions >= 0),
  price_total_cents    INT  NULL CHECK (price_total_cents IS NULL OR price_total_cents >= 0),
  currency_code        TEXT NOT NULL DEFAULT 'EUR',
  price_source         TEXT NOT NULL DEFAULT 'settings',
  usage_status         package_usage_status NOT NULL DEFAULT 'active',
  payment_status       package_payment_status NOT NULL DEFAULT 'unpaid',
  expires_at           TIMESTAMPTZ NULL,
  payment_method       TEXT NULL,
  notes_internal       TEXT NULL,
  is_single_technical  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE package IS 'Client session packages with credit tracking and payment status';
COMMENT ON COLUMN package.consumed_sessions IS 'Number of sessions already consumed';
COMMENT ON COLUMN package.on_hold_sessions IS 'Number of sessions reserved by confirmed events';
COMMENT ON COLUMN package.is_single_technical IS 'Auto-created 1-session technical package';

-- One active package per client constraint
CREATE UNIQUE INDEX uniq_active_package_per_client
ON package (client_id)
WHERE usage_status = 'active';

-- Performance indexes
CREATE INDEX idx_package_client ON package(client_id, usage_status);
CREATE INDEX idx_package_coach ON package(coach_id, usage_status);
CREATE INDEX idx_package_updated ON package(updated_at DESC);

-- Ledger entry types
CREATE TYPE ledger_type AS ENUM ('HOLD_CREATE','HOLD_RELEASE','CONSUME','CORRECTION');
CREATE TYPE ledger_reason AS ENUM ('CONFIRM','CANCEL_GT_24H','CANCEL_LT_24H','COMPLETE','ADMIN_CORRECTION','RECONCILE');

-- Ledger table for complete audit trail
CREATE TABLE package_ledger (
  ledger_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id           UUID NOT NULL REFERENCES package(package_id) ON DELETE CASCADE,
  calendar_event_id    UUID NULL REFERENCES events(id) ON DELETE SET NULL,
  type                 ledger_type NOT NULL,
  reason               ledger_reason NOT NULL,
  delta_consumed       INT NOT NULL DEFAULT 0,
  delta_hold           INT NOT NULL DEFAULT 0,
  note                 TEXT NULL,
  created_by           UUID NULL REFERENCES coaches(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE package_ledger IS 'Immutable audit log of all package credit changes';

-- Idempotency constraint: one ledger entry per event+type
CREATE UNIQUE INDEX uniq_ledger_event_type 
ON package_ledger(package_id, calendar_event_id, type)
WHERE calendar_event_id IS NOT NULL;

CREATE INDEX idx_ledger_package ON package_ledger(package_id, created_at DESC);
CREATE INDEX idx_ledger_event ON package_ledger(calendar_event_id);

-- Payment tracking table (for future use)
CREATE TABLE payment (
  payment_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id           UUID NOT NULL REFERENCES package(package_id) ON DELETE CASCADE,
  amount_cents         INT NOT NULL CHECK (amount_cents >= 0),
  currency_code        TEXT NOT NULL DEFAULT 'EUR',
  kind                 TEXT NOT NULL CHECK (kind IN ('charge','refund','deposit')),
  note                 TEXT NULL,
  created_by           UUID NULL REFERENCES coaches(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE payment IS 'Payment transactions linked to packages';

CREATE INDEX idx_payment_package ON payment(package_id, created_at DESC);

-- Coach package settings for price list
CREATE TABLE package_settings (
  settings_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id             UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  sessions_1_price     INT NOT NULL DEFAULT 5000 CHECK (sessions_1_price >= 0),
  sessions_5_price     INT NOT NULL DEFAULT 22500 CHECK (sessions_5_price >= 0),
  sessions_10_price    INT NOT NULL DEFAULT 40000 CHECK (sessions_10_price >= 0),
  sessions_20_price    INT NOT NULL DEFAULT 70000 CHECK (sessions_20_price >= 0),
  currency_code        TEXT NOT NULL DEFAULT 'EUR',
  lock_window_hours    INT NOT NULL DEFAULT 12 CHECK (lock_window_hours > 0),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE package_settings IS 'Coach-specific package price list and rules';

CREATE UNIQUE INDEX uniq_package_settings_per_coach ON package_settings(coach_id);

-- =====================================================
-- TRIGGERS: Enforce invariants and auto-updates
-- =====================================================

-- Function to enforce package invariants
CREATE OR REPLACE FUNCTION check_package_invariants()
RETURNS TRIGGER AS $$
BEGIN
  -- Enforce available sessions >= 0
  IF (NEW.total_sessions - NEW.consumed_sessions - NEW.on_hold_sessions) < 0 THEN
    RAISE EXCEPTION 'Invalid package state: available sessions cannot be negative (total:%, consumed:%, on_hold:%)', 
      NEW.total_sessions, NEW.consumed_sessions, NEW.on_hold_sessions;
  END IF;

  -- Auto-complete when all sessions consumed
  IF NEW.consumed_sessions >= NEW.total_sessions AND NEW.usage_status = 'active' THEN
    NEW.usage_status := 'completed';
  END IF;

  -- Update timestamp
  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER package_invariants_trigger
  BEFORE INSERT OR UPDATE ON package
  FOR EACH ROW
  EXECUTE FUNCTION check_package_invariants();

-- Function to update package settings timestamp
CREATE OR REPLACE FUNCTION update_package_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER package_settings_updated_at
  BEFORE UPDATE ON package_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_package_settings_timestamp();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE package ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_settings ENABLE ROW LEVEL SECURITY;

-- Package policies: coaches can only access their own clients' packages
CREATE POLICY "Coaches can view packages for their clients"
  ON package FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create packages for their clients"
  ON package FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update packages for their clients"
  ON package FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete packages for their clients"
  ON package FOR DELETE
  USING (coach_id = auth.uid());

-- Ledger policies
CREATE POLICY "Coaches can view ledger for their packages"
  ON package_ledger FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM package 
    WHERE package.package_id = package_ledger.package_id 
    AND package.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can create ledger entries for their packages"
  ON package_ledger FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM package 
    WHERE package.package_id = package_ledger.package_id 
    AND package.coach_id = auth.uid()
  ));

-- Payment policies
CREATE POLICY "Coaches can view payments for their packages"
  ON payment FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM package 
    WHERE package.package_id = payment.package_id 
    AND package.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can create payments for their packages"
  ON payment FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM package 
    WHERE package.package_id = payment.package_id 
    AND package.coach_id = auth.uid()
  ));

-- Settings policies
CREATE POLICY "Coaches can view their own settings"
  ON package_settings FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own settings"
  ON package_settings FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own settings"
  ON package_settings FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own settings"
  ON package_settings FOR DELETE
  USING (coach_id = auth.uid());