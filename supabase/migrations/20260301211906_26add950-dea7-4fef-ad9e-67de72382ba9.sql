
DROP FUNCTION IF EXISTS public.admin_get_coaches_overview();

CREATE FUNCTION public.admin_get_coaches_overview()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  active_clients_count bigint,
  total_events_count bigint,
  total_plans_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    u.email,
    u.first_name,
    u.last_name,
    u.created_at,
    au.last_sign_in_at,
    (SELECT count(*) FROM coach_clients cc WHERE cc.coach_id = c.id AND cc.status = 'active') AS active_clients_count,
    (SELECT count(*) FROM events e JOIN coach_clients cc ON cc.id = e.coach_client_id WHERE cc.coach_id = c.id AND e.canceled_by IS NULL) AS total_events_count,
    (SELECT count(*) FROM client_plans cp JOIN coach_clients cc ON cc.id = cp.coach_client_id WHERE cc.coach_id = c.id AND cp.deleted_at IS NULL) AS total_plans_count
  FROM coaches c
  JOIN users u ON u.id = c.id
  LEFT JOIN auth.users au ON au.id = c.id
  ORDER BY u.first_name ASC NULLS LAST, u.last_name ASC NULLS LAST;
$$;
