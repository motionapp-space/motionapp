-- ============================================================
-- Rimozione completa di active_plan_id da clients e coach_clients
-- ============================================================

-- 1. Drop FK e indici
ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_active_plan;
DROP INDEX IF EXISTS idx_clients_active_plan;
ALTER TABLE coach_clients DROP CONSTRAINT IF EXISTS coach_clients_active_plan_id_fkey;
DROP INDEX IF EXISTS idx_coach_clients_active_plan;

-- 2. Drop colonne
ALTER TABLE clients DROP COLUMN IF EXISTS active_plan_id;
ALTER TABLE coach_clients DROP COLUMN IF EXISTS active_plan_id;

-- 3. set_active_plan_v2 — versione finale (senza compat layer)
CREATE OR REPLACE FUNCTION set_active_plan_v2(
  p_coach_client_id uuid,
  p_plan_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_coach_id uuid;
  v_client_id uuid;
BEGIN
  SELECT coach_id, client_id INTO v_coach_id, v_client_id
  FROM coach_clients WHERE id = p_coach_client_id;

  IF v_coach_id IS NULL OR v_coach_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE client_plan_assignments
  SET status = 'COMPLETED', ended_at = now()
  WHERE coach_id = v_coach_id AND client_id = v_client_id AND status = 'ACTIVE';

  IF p_plan_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM client_plans
      WHERE id = p_plan_id AND coach_client_id = p_coach_client_id AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Plan not found or deleted';
    END IF;

    INSERT INTO client_plan_assignments (coach_id, client_id, plan_id, status, assigned_at)
    VALUES (v_coach_id, v_client_id, p_plan_id, 'ACTIVE', now());

    UPDATE client_plans SET in_use_at = now() WHERE id = p_plan_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'plan_id', p_plan_id);
END;
$$;

-- 4. fsm_assign_plan — versione finale (senza FOR LOOP, senza compat layer)
CREATE OR REPLACE FUNCTION public.fsm_assign_plan(
  p_coach_id uuid,
  p_client_id uuid,
  p_coach_client_id uuid,
  p_plan_name text,
  p_plan_description text DEFAULT NULL,
  p_plan_data jsonb DEFAULT '{"days":[]}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_plan_id uuid;
  v_old_plan_id uuid;
BEGIN
  -- 1. Close existing ACTIVE assignment (at most one, enforced by unique index)
  UPDATE client_plan_assignments
  SET status = 'COMPLETED', ended_at = now()
  WHERE coach_id = p_coach_id
    AND client_id = p_client_id
    AND status = 'ACTIVE'
  RETURNING plan_id INTO v_old_plan_id;

  IF v_old_plan_id IS NOT NULL THEN
    INSERT INTO plan_state_logs (plan_id, client_id, from_status, to_status, cause, actor_type, actor_id)
    VALUES (v_old_plan_id, p_client_id, 'IN_CORSO', 'COMPLETATO', 'AUTO_COMPLETE_ON_NEW_PLAN', 'PT', p_coach_id);
  END IF;

  -- 2. Create client_plans record (status frozen at 'IN_CORSO')
  INSERT INTO client_plans (coach_client_id, name, description, data, status, is_visible)
  VALUES (p_coach_client_id, p_plan_name, p_plan_description, p_plan_data, 'IN_CORSO', true)
  RETURNING id INTO v_new_plan_id;

  -- 3. Create new ACTIVE assignment (sole source of truth)
  INSERT INTO client_plan_assignments (coach_id, client_id, plan_id, status, assigned_at)
  VALUES (p_coach_id, p_client_id, v_new_plan_id, 'ACTIVE', now());

  -- 4. Log the new assignment
  INSERT INTO plan_state_logs (plan_id, client_id, from_status, to_status, cause, actor_type, actor_id)
  VALUES (v_new_plan_id, p_client_id, NULL, 'IN_CORSO', 'ASSIGN_PLAN', 'PT', p_coach_id);

  RETURN jsonb_build_object(
    'success', true,
    'plan_id', v_new_plan_id,
    'old_assignment_closed', (v_old_plan_id IS NOT NULL)
  );
END;
$$;

-- 5. Aggiornare anche delete_plan RPC che referenzia coach_clients.active_plan_id
CREATE OR REPLACE FUNCTION public.delete_plan(p_coach_client_id uuid, p_plan_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coach_id uuid;
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

  RETURN true;
END;
$$;