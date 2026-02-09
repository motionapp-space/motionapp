
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

  -- 5. Notify the client about the new plan assignment
  INSERT INTO client_notifications (client_id, type, title, message, related_id, related_type)
  VALUES (
    p_client_id,
    'plan_assigned',
    'Nuovo piano assegnato',
    'Il tuo coach ti ha assegnato il piano "' || p_plan_name || '"',
    v_new_plan_id,
    'plan'
  );

  RETURN jsonb_build_object(
    'success', true,
    'plan_id', v_new_plan_id,
    'old_assignment_closed', (v_old_plan_id IS NOT NULL)
  );
END;
$$;
