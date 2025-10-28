-- Idempotent migration for client and plan states

-- Drop default constraint on clients.status if it exists
DO $$ 
BEGIN
  ALTER TABLE clients ALTER COLUMN status DROP DEFAULT;
EXCEPTION 
  WHEN others THEN NULL;
END $$;

-- Update client_status enum (only if not already done)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'INATTIVO' AND enumtypid = 'client_status'::regtype) THEN
    ALTER TYPE client_status RENAME TO client_status_old;
    CREATE TYPE client_status AS ENUM ('POTENZIALE', 'ATTIVO', 'INATTIVO', 'ARCHIVIATO');
    ALTER TABLE clients ALTER COLUMN status TYPE client_status USING 
      CASE status::text 
        WHEN 'SOSPESO' THEN 'INATTIVO'::client_status
        ELSE status::text::client_status
      END;
    DROP TYPE client_status_old;
  END IF;
END $$;

-- Re-add default
ALTER TABLE clients ALTER COLUMN status SET DEFAULT 'POTENZIALE'::client_status;

-- Drop and recreate plan_status enum to ensure it has correct values
DROP TYPE IF EXISTS plan_status CASCADE;
CREATE TYPE plan_status AS ENUM ('IN_CORSO', 'COMPLETATO', 'ELIMINATO');

-- Add new columns to clients table
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS active_plan_id uuid,
  ADD COLUMN IF NOT EXISTS last_access_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- Handle client_plans status column migration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_plans' AND column_name = 'old_status') THEN
    ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS status plan_status NOT NULL DEFAULT 'IN_CORSO'::plan_status;
    UPDATE client_plans 
    SET status = CASE 
      WHEN old_status IN ('ACTIVE', 'ATTIVA') THEN 'IN_CORSO'::plan_status
      WHEN old_status IN ('COMPLETED', 'COMPLETATA') THEN 'COMPLETATO'::plan_status
      ELSE 'IN_CORSO'::plan_status
    END;
    ALTER TABLE client_plans DROP COLUMN old_status;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_plans' AND column_name = 'status') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_plans' AND column_name = 'status' AND udt_name = 'plan_status') THEN
      ALTER TABLE client_plans RENAME COLUMN status TO old_status;
      ALTER TABLE client_plans ADD COLUMN status plan_status NOT NULL DEFAULT 'IN_CORSO'::plan_status;
      UPDATE client_plans 
      SET status = CASE 
        WHEN old_status IN ('ACTIVE', 'ATTIVA') THEN 'IN_CORSO'::plan_status
        WHEN old_status IN ('COMPLETED', 'COMPLETATA') THEN 'COMPLETATO'::plan_status
        ELSE 'IN_CORSO'::plan_status
      END;
      ALTER TABLE client_plans DROP COLUMN old_status;
    END IF;
  END IF;
END $$;

-- Add other client_plans columns
ALTER TABLE client_plans 
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- Fix duplicate IN_CORSO plans: keep only the most recent one per client
DO $$
DECLARE
  dup_record RECORD;
BEGIN
  FOR dup_record IN 
    SELECT client_id 
    FROM client_plans 
    WHERE status = 'IN_CORSO' AND is_visible = true
    GROUP BY client_id
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the most recent plan as IN_CORSO, set others to COMPLETATO
    WITH ranked_plans AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
      FROM client_plans
      WHERE client_id = dup_record.client_id 
        AND status = 'IN_CORSO' 
        AND is_visible = true
    )
    UPDATE client_plans
    SET status = 'COMPLETATO'::plan_status,
        completed_at = now(),
        locked_at = now()
    WHERE id IN (
      SELECT id FROM ranked_plans WHERE rn > 1
    );
  END LOOP;
END $$;

-- Add foreign key constraint on clients.active_plan_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_clients_active_plan' AND table_name = 'clients'
  ) THEN
    ALTER TABLE clients 
    ADD CONSTRAINT fk_clients_active_plan 
    FOREIGN KEY (active_plan_id) REFERENCES client_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create client_state_logs table
CREATE TABLE IF NOT EXISTS client_state_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  from_status client_status,
  to_status client_status NOT NULL,
  cause text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('SYSTEM', 'PT')),
  actor_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create plan_state_logs table
CREATE TABLE IF NOT EXISTS plan_state_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES client_plans(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  from_status plan_status,
  to_status plan_status NOT NULL,
  cause text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('SYSTEM', 'PT')),
  actor_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on log tables
ALTER TABLE client_state_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_state_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_state_logs
DO $$
BEGIN
  DROP POLICY IF EXISTS "Coaches can view logs for their clients" ON client_state_logs;
  DROP POLICY IF EXISTS "System can insert client state logs" ON client_state_logs;
END $$;

CREATE POLICY "Coaches can view logs for their clients"
  ON client_state_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = client_state_logs.client_id AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "System can insert client state logs"
  ON client_state_logs FOR INSERT
  WITH CHECK (true);

-- RLS policies for plan_state_logs
DO $$
BEGIN
  DROP POLICY IF EXISTS "Coaches can view plan logs for their clients" ON plan_state_logs;
  DROP POLICY IF EXISTS "System can insert plan state logs" ON plan_state_logs;
END $$;

CREATE POLICY "Coaches can view plan logs for their clients"
  ON plan_state_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM clients WHERE clients.id = plan_state_logs.client_id AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "System can insert plan state logs"
  ON plan_state_logs FOR INSERT
  WITH CHECK (true);

-- Create unique partial index: only one IN_CORSO plan per client (now that we've fixed duplicates)
DROP INDEX IF EXISTS idx_one_active_plan_per_client;
CREATE UNIQUE INDEX idx_one_active_plan_per_client 
  ON client_plans(client_id) 
  WHERE status = 'IN_CORSO' AND is_visible = true;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_active_plan ON clients(active_plan_id) WHERE active_plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_plans_status ON client_plans(status);
CREATE INDEX IF NOT EXISTS idx_client_plans_visible ON client_plans(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_client_plans_client_status ON client_plans(client_id, status);
CREATE INDEX IF NOT EXISTS idx_client_state_logs_client ON client_state_logs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_state_logs_plan ON plan_state_logs(plan_id, created_at DESC);

-- Function to increment version on update
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for version management
DROP TRIGGER IF EXISTS clients_increment_version ON clients;
CREATE TRIGGER clients_increment_version
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS client_plans_increment_version ON client_plans;
CREATE TRIGGER client_plans_increment_version
  BEFORE UPDATE ON client_plans
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();