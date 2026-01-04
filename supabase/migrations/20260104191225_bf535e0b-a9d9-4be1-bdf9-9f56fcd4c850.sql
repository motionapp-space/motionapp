-- ============================================================
-- STEP A: Client Plan Simplification Migration
-- ============================================================

-- A.1 Add active_plan_id to coach_clients
ALTER TABLE coach_clients 
ADD COLUMN IF NOT EXISTS active_plan_id uuid REFERENCES client_plans(id) ON DELETE SET NULL;

-- A.2 Add in_use_at to client_plans
ALTER TABLE client_plans 
ADD COLUMN IF NOT EXISTS in_use_at timestamptz;

-- A.3 Add last_used_at to client_plans
ALTER TABLE client_plans 
ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

-- A.4 Add plan_day_snapshot to training_sessions
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS plan_day_snapshot jsonb;

-- A.5 Create index for performance
CREATE INDEX IF NOT EXISTS idx_coach_clients_active_plan 
ON coach_clients(active_plan_id) WHERE active_plan_id IS NOT NULL;

-- ============================================================
-- A.6 Backfill active_plan_id
-- Priority: is_in_use=true, then most recent non-deleted
-- ============================================================

-- First: plans with is_in_use=true
WITH active_plans AS (
  SELECT DISTINCT ON (coach_client_id)
    coach_client_id,
    id as plan_id
  FROM client_plans
  WHERE deleted_at IS NULL
    AND is_in_use = true
  ORDER BY coach_client_id, updated_at DESC
)
UPDATE coach_clients cc
SET active_plan_id = ap.plan_id
FROM active_plans ap
WHERE cc.id = ap.coach_client_id;

-- Fallback: most recent non-deleted plan
WITH fallback_plans AS (
  SELECT DISTINCT ON (coach_client_id)
    coach_client_id,
    id as plan_id
  FROM client_plans
  WHERE deleted_at IS NULL
  ORDER BY coach_client_id, updated_at DESC
)
UPDATE coach_clients cc
SET active_plan_id = fp.plan_id
FROM fallback_plans fp
WHERE cc.id = fp.coach_client_id
  AND cc.active_plan_id IS NULL;

-- ============================================================
-- A.7 Backfill in_use_at for active plans
-- ============================================================

UPDATE client_plans cp
SET in_use_at = now()
FROM coach_clients cc
WHERE cc.active_plan_id = cp.id
  AND cp.in_use_at IS NULL;

-- ============================================================
-- A.8 Backfill last_used_at from training_sessions
-- ============================================================

UPDATE client_plans cp
SET last_used_at = s.max_date
FROM (
  SELECT plan_id, MAX(COALESCE(ended_at, scheduled_at)) as max_date
  FROM training_sessions
  WHERE plan_id IS NOT NULL
  GROUP BY plan_id
) s
WHERE cp.id = s.plan_id
  AND cp.last_used_at IS NULL;

-- ============================================================
-- RPC: set_active_plan
-- ============================================================

CREATE OR REPLACE FUNCTION set_active_plan(
  p_coach_client_id uuid,
  p_plan_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach_id uuid;
BEGIN
  -- Auth: coach_clients.coach_id must be auth.uid()
  SELECT coach_id INTO v_coach_id
  FROM coach_clients
  WHERE id = p_coach_client_id;
  
  IF v_coach_id IS NULL OR v_coach_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- If plan_id not null, validate ownership and not deleted
  IF p_plan_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM client_plans 
      WHERE id = p_plan_id 
        AND coach_client_id = p_coach_client_id
        AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Plan not found or deleted';
    END IF;
    
    -- Update in_use_at on the plan
    UPDATE client_plans
    SET in_use_at = now()
    WHERE id = p_plan_id;
  END IF;
  
  -- Update coach_clients.active_plan_id
  UPDATE coach_clients
  SET active_plan_id = p_plan_id, updated_at = now()
  WHERE id = p_coach_client_id;
  
  RETURN p_plan_id;
END;
$$;

-- ============================================================
-- RPC: delete_plan (soft delete only)
-- ============================================================

CREATE OR REPLACE FUNCTION delete_plan(
  p_coach_client_id uuid,
  p_plan_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach_id uuid;
  v_active_plan_id uuid;
BEGIN
  -- Auth check
  SELECT coach_id INTO v_coach_id
  FROM coach_clients
  WHERE id = p_coach_client_id;
  
  IF v_coach_id IS NULL OR v_coach_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Validate plan ownership
  IF NOT EXISTS (
    SELECT 1 FROM client_plans 
    WHERE id = p_plan_id 
      AND coach_client_id = p_coach_client_id
  ) THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;
  
  -- Soft delete
  UPDATE client_plans
  SET deleted_at = now()
  WHERE id = p_plan_id;
  
  -- If this was the active plan, set active_plan_id to NULL
  SELECT active_plan_id INTO v_active_plan_id
  FROM coach_clients
  WHERE id = p_coach_client_id;
  
  IF v_active_plan_id = p_plan_id THEN
    UPDATE coach_clients
    SET active_plan_id = NULL, updated_at = now()
    WHERE id = p_coach_client_id;
  END IF;
  
  RETURN true;
END;
$$;

-- ============================================================
-- RPC: capture_session_snapshot (idempotent, DB-side)
-- ============================================================

CREATE OR REPLACE FUNCTION capture_session_snapshot(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session training_sessions%ROWTYPE;
  v_plan client_plans%ROWTYPE;
  v_day jsonb;
  v_snapshot jsonb;
BEGIN
  -- Read session
  SELECT * INTO v_session FROM training_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
  -- IDEMPOTENT: if snapshot already exists, return true without changes
  IF v_session.plan_day_snapshot IS NOT NULL THEN
    RETURN true;
  END IF;
  
  -- If no plan_id or day_id, no snapshot needed
  IF v_session.plan_id IS NULL OR v_session.day_id IS NULL THEN
    RETURN true;
  END IF;
  
  -- Read plan
  SELECT * INTO v_plan FROM client_plans WHERE id = v_session.plan_id;
  IF NOT FOUND THEN
    -- Plan not found, save warning
    v_snapshot := jsonb_build_object(
      'plan_id', v_session.plan_id,
      'plan_name', NULL,
      'day_id', v_session.day_id,
      'day_title', NULL,
      'day_structure', NULL,
      'captured_at', now(),
      'warning', 'PLAN_NOT_FOUND'
    );
    UPDATE training_sessions SET plan_day_snapshot = v_snapshot WHERE id = p_session_id;
    RETURN true;
  END IF;
  
  -- Find day in JSON (client_plans.data.days[])
  SELECT d INTO v_day
  FROM jsonb_array_elements(v_plan.data->'days') d
  WHERE d->>'id' = v_session.day_id::text;
  
  IF v_day IS NULL THEN
    -- Day not found, save warning
    v_snapshot := jsonb_build_object(
      'plan_id', v_session.plan_id,
      'plan_name', v_plan.name,
      'day_id', v_session.day_id,
      'day_title', NULL,
      'day_structure', NULL,
      'captured_at', now(),
      'warning', 'DAY_NOT_FOUND'
    );
  ELSE
    -- Complete snapshot
    v_snapshot := jsonb_build_object(
      'plan_id', v_session.plan_id,
      'plan_name', v_plan.name,
      'day_id', v_session.day_id,
      'day_title', v_day->>'title',
      'day_structure', v_day,
      'captured_at', now()
    );
  END IF;
  
  UPDATE training_sessions SET plan_day_snapshot = v_snapshot WHERE id = p_session_id;
  RETURN true;
END;
$$;

-- ============================================================
-- Trigger: auto-capture snapshot on session completion
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_capture_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Trigger when: status becomes 'completed' OR ended_at is set
  IF (
    (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
    OR
    (NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL)
  ) THEN
    PERFORM capture_session_snapshot(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_capture_session_snapshot ON training_sessions;

CREATE TRIGGER trg_capture_session_snapshot
AFTER UPDATE ON training_sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_capture_snapshot();