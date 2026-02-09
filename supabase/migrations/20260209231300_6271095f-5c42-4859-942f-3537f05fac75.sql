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
  v_plan_name text;
BEGIN
  SELECT coach_id, client_id INTO v_coach_id, v_client_id
  FROM coach_clients WHERE id = p_coach_client_id;

  IF v_coach_id IS NULL OR v_coach_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Chiudi assignment attivo esistente
  UPDATE client_plan_assignments
  SET status = 'COMPLETED', ended_at = now()
  WHERE coach_id = v_coach_id
    AND client_id = v_client_id
    AND status = 'ACTIVE';

  IF p_plan_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM client_plans
      WHERE id = p_plan_id
        AND coach_client_id = p_coach_client_id
        AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Plan not found or deleted';
    END IF;

    -- Recupera il nome del piano per la notifica
    SELECT name INTO v_plan_name
    FROM client_plans WHERE id = p_plan_id;

    -- Crea nuovo assignment ACTIVE
    INSERT INTO client_plan_assignments
      (coach_id, client_id, plan_id, status, assigned_at)
    VALUES
      (v_coach_id, v_client_id, p_plan_id, 'ACTIVE', now());

    UPDATE client_plans SET in_use_at = now() WHERE id = p_plan_id;

    -- Notifica il cliente
    INSERT INTO client_notifications
      (client_id, type, title, message, related_id, related_type)
    VALUES (
      v_client_id,
      'plan_assigned',
      'Nuovo piano assegnato',
      'Il tuo coach ti ha assegnato il piano "' || COALESCE(v_plan_name, 'Piano') || '"',
      p_plan_id,
      'plan'
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'plan_id', p_plan_id);
END;
$$;