
-- 1. RLS: allow clients to read their own assignments
CREATE POLICY "Clients can view own assignments"
  ON client_plan_assignments FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- 2. RPC set_active_plan_v2 — transactional, operates on client_plan_assignments
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
  -- Auth: verify caller is the coach
  SELECT coach_id, client_id INTO v_coach_id, v_client_id
  FROM coach_clients WHERE id = p_coach_client_id;

  IF v_coach_id IS NULL OR v_coach_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Close existing ACTIVE assignment(s)
  UPDATE client_plan_assignments
  SET status = 'COMPLETED', ended_at = now()
  WHERE coach_id = v_coach_id AND client_id = v_client_id AND status = 'ACTIVE';

  -- If setting a new active plan
  IF p_plan_id IS NOT NULL THEN
    -- Validate plan ownership and not deleted
    IF NOT EXISTS (
      SELECT 1 FROM client_plans
      WHERE id = p_plan_id AND coach_client_id = p_coach_client_id AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Plan not found or deleted';
    END IF;

    -- Create new ACTIVE assignment
    INSERT INTO client_plan_assignments (coach_id, client_id, plan_id, status, assigned_at)
    VALUES (v_coach_id, v_client_id, p_plan_id, 'ACTIVE', now());

    -- Update in_use_at on plan
    UPDATE client_plans SET in_use_at = now() WHERE id = p_plan_id;
  END IF;

  -- [COMPAT LAYER] Sync coach_clients.active_plan_id
  UPDATE coach_clients
  SET active_plan_id = p_plan_id, updated_at = now()
  WHERE id = p_coach_client_id;

  RETURN jsonb_build_object('success', true, 'plan_id', p_plan_id);
END;
$$;
