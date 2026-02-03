-- RPC function per onboarding coach: ritorna tutti i dati necessari in una singola chiamata
CREATE OR REPLACE FUNCTION public.get_coach_onboarding_data(p_coach_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  -- Auth check: solo il coach può chiamare per se stesso
  IF p_coach_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  WITH coach_client_ids AS (
    SELECT id AS coach_client_id, client_id
    FROM coach_clients
    WHERE coach_id = p_coach_id
      AND status = 'active'
  ),
  has_active AS (
    SELECT EXISTS (
      SELECT 1
      FROM clients c
      INNER JOIN coach_client_ids cc ON c.id = cc.client_id
      WHERE c.archived_at IS NULL
    ) AS val
  ),
  has_archived AS (
    SELECT EXISTS (
      SELECT 1
      FROM clients c
      INNER JOIN coach_client_ids cc ON c.id = cc.client_id
      WHERE c.archived_at IS NOT NULL
    ) AS val
  ),
  has_plan AS (
    SELECT EXISTS (
      SELECT 1
      FROM client_plans cp
      INNER JOIN coach_client_ids cc ON cp.coach_client_id = cc.coach_client_id
      WHERE cp.status = 'IN_CORSO'
        AND cp.deleted_at IS NULL
    ) AS val
  ),
  has_event AS (
    SELECT EXISTS (
      SELECT 1
      FROM events e
      INNER JOIN coach_client_ids cc ON e.coach_client_id = cc.coach_client_id
    ) AS val
  )
  SELECT json_build_object(
    'has_active_clients', (SELECT val FROM has_active),
    'has_archived_clients', (SELECT val FROM has_archived),
    'has_any_plan', (SELECT val FROM has_plan),
    'has_any_appointment', (SELECT val FROM has_event)
  ) INTO v_result;

  RETURN v_result;
END;
$$;