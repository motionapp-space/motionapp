-- ================================================================
-- DATABASE MIGRATIONS - NON-BREAKING SCHEMA ALIGNMENT (FIXED)
-- ================================================================
-- This version handles existing policies properly

-- ================================================================
-- SECTION 1: CORE ENTITY ENHANCEMENTS
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'fiscal_code'
  ) THEN
    ALTER TABLE clients ADD COLUMN fiscal_code TEXT;
    COMMENT ON COLUMN clients.fiscal_code IS 'Italian fiscal code (codice fiscale) - must be unique if provided';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_fiscal_code_unique ON clients(fiscal_code) WHERE fiscal_code IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plan_templates' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE plan_templates ADD COLUMN deleted_at TIMESTAMPTZ;
    COMMENT ON COLUMN plan_templates.deleted_at IS 'Soft delete timestamp - non-null means template is deleted';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_plan_templates_not_deleted ON plan_templates(coach_id, updated_at DESC) WHERE deleted_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'client_plans' AND column_name = 'objective'
  ) THEN
    ALTER TABLE client_plans ADD COLUMN objective TEXT;
    COMMENT ON COLUMN client_plans.objective IS 'Plan goal or purpose';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'client_plans' AND column_name = 'duration_weeks'
  ) THEN
    ALTER TABLE client_plans ADD COLUMN duration_weeks INTEGER;
    COMMENT ON COLUMN client_plans.duration_weeks IS 'Planned duration of program in weeks';
  END IF;
END $$;

-- ================================================================
-- SECTION 2: NEW TABLES (IF NOT EXISTS)
-- ================================================================

CREATE TABLE IF NOT EXISTS coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'primary' CHECK (role IN ('primary', 'assistant', 'nutritionist', 'physiotherapist')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'terminated')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT coach_clients_date_logic CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_coach_clients_coach_id ON coach_clients(coach_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_clients_client_id ON coach_clients(client_id, status, started_at DESC);

CREATE OR REPLACE FUNCTION update_coach_clients_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_coach_clients_updated_at ON coach_clients;
CREATE TRIGGER trigger_coach_clients_updated_at BEFORE UPDATE ON coach_clients FOR EACH ROW EXECUTE FUNCTION update_coach_clients_updated_at();

INSERT INTO coach_clients (coach_id, client_id, role, status, started_at, notes)
SELECT coach_id, id, 'primary', 
  CASE WHEN status = 'ARCHIVIATO' THEN 'terminated' WHEN status = 'INATTIVO' THEN 'paused' ELSE 'active' END,
  created_at, 'Migrated from clients.coach_id'
FROM clients
WHERE NOT EXISTS (SELECT 1 FROM coach_clients cc WHERE cc.coach_id = clients.coach_id AND cc.client_id = clients.id);

-- ================================================================
-- SECTION 3: PACKAGE TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS package_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_sessions INTEGER NOT NULL CHECK (total_sessions > 0),
  duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
  price_cents BIGINT NOT NULL CHECK (price_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_package_types_coach_active ON package_types(coach_id, is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_package_types_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_package_types_updated_at ON package_types;
CREATE TRIGGER trigger_package_types_updated_at BEFORE UPDATE ON package_types FOR EACH ROW EXECUTE FUNCTION update_package_types_updated_at();

CREATE TABLE IF NOT EXISTS client_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  package_type_id UUID NOT NULL REFERENCES package_types(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'expired', 'cancelled')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  sessions_total INTEGER NOT NULL CHECK (sessions_total > 0),
  sessions_remaining INTEGER NOT NULL CHECK (sessions_remaining >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_packages_remaining_logic CHECK (sessions_remaining <= sessions_total)
);

CREATE INDEX IF NOT EXISTS idx_client_packages_client_status ON client_packages(client_id, status, valid_until DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_client_packages_expiring_soon ON client_packages(valid_until) WHERE status = 'active' AND valid_until IS NOT NULL;

CREATE OR REPLACE FUNCTION update_client_packages_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_client_packages_updated_at ON client_packages;
CREATE TRIGGER trigger_client_packages_updated_at BEFORE UPDATE ON client_packages FOR EACH ROW EXECUTE FUNCTION update_client_packages_updated_at();

CREATE TABLE IF NOT EXISTS package_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_package_id UUID NOT NULL REFERENCES client_packages(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
  units INTEGER NOT NULL DEFAULT 1 CHECK (units > 0),
  reason TEXT,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT package_consumptions_session_unique UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_package_consumptions_package_time ON package_consumptions(client_package_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_package_consumptions_session ON package_consumptions(session_id) WHERE session_id IS NOT NULL;

-- ================================================================
-- SECTION 4: BOOKING ENHANCEMENTS
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'booking_settings' AND column_name = 'max_future_days') THEN
    ALTER TABLE booking_settings ADD COLUMN max_future_days INTEGER DEFAULT 90 CHECK (max_future_days > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'booking_settings' AND column_name = 'cancel_policy_hours') THEN
    ALTER TABLE booking_settings ADD COLUMN cancel_policy_hours INTEGER DEFAULT 24 CHECK (cancel_policy_hours >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'booking_settings' AND column_name = 'buffer_before_minutes') THEN
    ALTER TABLE booking_settings ADD COLUMN buffer_before_minutes INTEGER DEFAULT 0 CHECK (buffer_before_minutes >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'booking_settings' AND column_name = 'buffer_after_minutes') THEN
    ALTER TABLE booking_settings ADD COLUMN buffer_after_minutes INTEGER DEFAULT 0 CHECK (buffer_after_minutes >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'booking_settings' AND column_name = 'timezone') THEN
    ALTER TABLE booking_settings ADD COLUMN timezone TEXT DEFAULT 'Europe/Rome';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'availability_windows' AND column_name = 'type') THEN
    ALTER TABLE availability_windows ADD COLUMN type TEXT DEFAULT 'weekly_recurring' CHECK (type IN ('weekly_recurring', 'one_off'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'availability_windows' AND column_name = 'start_date') THEN
    ALTER TABLE availability_windows ADD COLUMN start_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'availability_windows' AND column_name = 'end_date') THEN
    ALTER TABLE availability_windows ADD COLUMN end_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'availability_windows' AND column_name = 'location') THEN
    ALTER TABLE availability_windows ADD COLUMN location TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'availability_windows' AND column_name = 'capacity') THEN
    ALTER TABLE availability_windows ADD COLUMN capacity INTEGER DEFAULT 1 CHECK (capacity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'availability_windows' AND column_name = 'is_active') THEN
    ALTER TABLE availability_windows ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_availability_windows_coach_active ON availability_windows(coach_id, day_of_week, is_active) WHERE is_active = true AND type = 'weekly_recurring';
CREATE INDEX IF NOT EXISTS idx_availability_windows_oneoff ON availability_windows(coach_id, start_date, end_date, is_active) WHERE is_active = true AND type = 'one_off';

-- ================================================================
-- SECTION 5: MEASUREMENT TYPES
-- ================================================================

CREATE TABLE IF NOT EXISTS measurement_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  decimals INTEGER DEFAULT 1 CHECK (decimals >= 0 AND decimals <= 4),
  min_value NUMERIC,
  max_value NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT measurement_types_min_max_logic CHECK (min_value IS NULL OR max_value IS NULL OR min_value < max_value)
);

CREATE INDEX IF NOT EXISTS idx_measurement_types_code ON measurement_types(code);
CREATE INDEX IF NOT EXISTS idx_measurement_types_active ON measurement_types(is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_measurement_types_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_measurement_types_updated_at ON measurement_types;
CREATE TRIGGER trigger_measurement_types_updated_at BEFORE UPDATE ON measurement_types FOR EACH ROW EXECUTE FUNCTION update_measurement_types_updated_at();

INSERT INTO measurement_types (code, name, unit, decimals, min_value, max_value) VALUES
  ('WEIGHT', 'Peso corporeo', 'kg', 1, 20, 300),
  ('HEIGHT', 'Altezza', 'cm', 0, 50, 250),
  ('BMI', 'Indice di massa corporea', '', 1, 10, 60),
  ('BODY_FAT', 'Massa grassa', '%', 1, 1, 70),
  ('LEAN_MASS', 'Massa magra', 'kg', 1, 10, 150),
  ('WAIST', 'Circonferenza vita', 'cm', 0, 30, 200),
  ('HIP', 'Circonferenza fianchi', 'cm', 0, 30, 200),
  ('CHEST', 'Circonferenza torace', 'cm', 0, 30, 200),
  ('ARM', 'Circonferenza braccio', 'cm', 0, 10, 80),
  ('THIGH', 'Circonferenza coscia', 'cm', 0, 20, 120)
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- SECTION 6: PERFORMANCE INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_events_coach_time ON events(coach_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_events_client_time ON events(client_id, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_coach_status_time ON events(coach_id, session_status, start_at) WHERE session_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_booking_requests_coach_status ON booking_requests(coach_id, status, requested_start_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_booking_requests_client ON booking_requests(client_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_sessions_client_started ON training_sessions(client_id, started_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_training_sessions_plan_status ON training_sessions(plan_id, status) WHERE plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_time ON training_sessions(coach_id, started_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_training_sessions_event ON training_sessions(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercise_actuals_exercise_time ON exercise_actuals(exercise_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_actuals_session_time ON exercise_actuals(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_client_plans_client_status ON client_plans(client_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_plans_status_visible ON client_plans(status, is_visible, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_client_plans_derived_from ON client_plans(derived_from_template_id) WHERE derived_from_template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_coach_status ON clients(coach_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_coach_created ON clients(coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status, updated_at DESC) WHERE status != 'ARCHIVIATO';
CREATE INDEX IF NOT EXISTS idx_client_state_logs_client_time ON client_state_logs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_state_logs_plan_time ON plan_state_logs(plan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_state_logs_client_time ON plan_state_logs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_client_date ON measurements(client_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_client_activities_client_time ON client_activities(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_templates_coach_updated ON plan_templates(coach_id, updated_at DESC) WHERE deleted_at IS NULL;

-- ================================================================
-- SECTION 7: AUTOVACUUM TUNING
-- ================================================================

ALTER TABLE training_sessions SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE events SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02, fillfactor = 85);
ALTER TABLE clients SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE client_plans SET (autovacuum_vacuum_scale_factor = 0.05, fillfactor = 85);
ALTER TABLE booking_requests SET (autovacuum_vacuum_scale_factor = 0.05);

-- ================================================================
-- SECTION 8: RLS POLICIES (DROP & RECREATE)
-- ================================================================

ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Coaches can view relationships for their clients" ON coach_clients;
  DROP POLICY IF EXISTS "Coaches can create relationships for themselves" ON coach_clients;
  DROP POLICY IF EXISTS "Coaches can update their own relationships" ON coach_clients;
  DROP POLICY IF EXISTS "Coaches can delete their own relationships" ON coach_clients;
  DROP POLICY IF EXISTS "Coaches can view their own package types" ON package_types;
  DROP POLICY IF EXISTS "Coaches can create their own package types" ON package_types;
  DROP POLICY IF EXISTS "Coaches can update their own package types" ON package_types;
  DROP POLICY IF EXISTS "Coaches can delete their own package types" ON package_types;
  DROP POLICY IF EXISTS "Coaches can view packages for their clients" ON client_packages;
  DROP POLICY IF EXISTS "Coaches can create packages for their clients" ON client_packages;
  DROP POLICY IF EXISTS "Coaches can update packages for their clients" ON client_packages;
  DROP POLICY IF EXISTS "Coaches can delete packages for their clients" ON client_packages;
  DROP POLICY IF EXISTS "Coaches can view consumptions for their clients' packages" ON package_consumptions;
  DROP POLICY IF EXISTS "Coaches can create consumptions for their clients' packages" ON package_consumptions;
  DROP POLICY IF EXISTS "Coaches can update consumptions for their clients' packages" ON package_consumptions;
  DROP POLICY IF EXISTS "Coaches can delete consumptions for their clients' packages" ON package_consumptions;
  DROP POLICY IF EXISTS "Anyone can view measurement types" ON measurement_types;
END $$;

CREATE POLICY "Coaches can view relationships for their clients" ON coach_clients FOR SELECT
  USING (auth.uid() = coach_id OR client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));
CREATE POLICY "Coaches can create relationships for themselves" ON coach_clients FOR INSERT
  WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update their own relationships" ON coach_clients FOR UPDATE
  USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can delete their own relationships" ON coach_clients FOR DELETE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can view their own package types" ON package_types FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can create their own package types" ON package_types FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update their own package types" ON package_types FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can delete their own package types" ON package_types FOR DELETE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can view packages for their clients" ON client_packages FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));
CREATE POLICY "Coaches can create packages for their clients" ON client_packages FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));
CREATE POLICY "Coaches can update packages for their clients" ON client_packages FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));
CREATE POLICY "Coaches can delete packages for their clients" ON client_packages FOR DELETE
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));

CREATE POLICY "Coaches can view consumptions for their clients' packages" ON package_consumptions FOR SELECT
  USING (client_package_id IN (SELECT cp.id FROM client_packages cp JOIN clients c ON c.id = cp.client_id WHERE c.coach_id = auth.uid()));
CREATE POLICY "Coaches can create consumptions for their clients' packages" ON package_consumptions FOR INSERT
  WITH CHECK (client_package_id IN (SELECT cp.id FROM client_packages cp JOIN clients c ON c.id = cp.client_id WHERE c.coach_id = auth.uid()));
CREATE POLICY "Coaches can update consumptions for their clients' packages" ON package_consumptions FOR UPDATE
  USING (client_package_id IN (SELECT cp.id FROM client_packages cp JOIN clients c ON c.id = cp.client_id WHERE c.coach_id = auth.uid()));
CREATE POLICY "Coaches can delete consumptions for their clients' packages" ON package_consumptions FOR DELETE
  USING (client_package_id IN (SELECT cp.id FROM client_packages cp JOIN clients c ON c.id = cp.client_id WHERE c.coach_id = auth.uid()));

CREATE POLICY "Anyone can view measurement types" ON measurement_types FOR SELECT USING (true);