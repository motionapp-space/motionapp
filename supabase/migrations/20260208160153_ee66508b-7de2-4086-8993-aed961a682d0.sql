-- Drop old function and recreate with new return type (includes has_active_plan)
DROP FUNCTION IF EXISTS public.compute_client_table_data_batch(uuid[]);

CREATE OR REPLACE FUNCTION public.compute_client_table_data_batch(p_client_ids uuid[])
RETURNS TABLE(
  client_id uuid, 
  plan_weeks_since_assignment integer, 
  package_status text, 
  appointment_status text, 
  activity_status text, 
  next_appointment_date timestamp with time zone,
  has_active_plan boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH 
  -- CTE per clienti con piano attivo
  active_plan_clients AS (
    SELECT DISTINCT cpa.client_id
    FROM client_plan_assignments cpa
    WHERE cpa.client_id = ANY(p_client_ids)
      AND cpa.status = 'ACTIVE'
  ),
  
  -- CTE esistenti preservate
  last_plans AS (
    SELECT DISTINCT ON (cpa.client_id)
      cpa.client_id,
      cpa.assigned_at
    FROM client_plan_assignments cpa
    WHERE cpa.client_id = ANY(p_client_ids)
    ORDER BY cpa.client_id, cpa.assigned_at DESC
  ),
  
  active_packages AS (
    SELECT DISTINCT ON (cc.client_id)
      cc.client_id,
      p.consumed_sessions,
      p.total_sessions,
      p.expires_at,
      p.usage_status
    FROM package p
    JOIN coach_clients cc ON cc.id = p.coach_client_id
    WHERE cc.client_id = ANY(p_client_ids)
      AND p.usage_status = 'active'
    ORDER BY cc.client_id, p.created_at DESC
  ),
  
  next_events AS (
    SELECT DISTINCT ON (cc.client_id)
      cc.client_id,
      e.start_at
    FROM events e
    JOIN coach_clients cc ON cc.id = e.coach_client_id
    WHERE cc.client_id = ANY(p_client_ids)
      AND e.start_at > NOW()
    ORDER BY cc.client_id, e.start_at ASC
  ),
  
  last_sessions AS (
    SELECT DISTINCT ON (cc.client_id)
      cc.client_id,
      ts.ended_at
    FROM training_sessions ts
    JOIN coach_clients cc ON cc.id = ts.coach_client_id
    WHERE cc.client_id = ANY(p_client_ids)
      AND ts.status = 'completed'
    ORDER BY cc.client_id, ts.ended_at DESC
  )
  
  SELECT 
    c.id AS client_id,
    
    CASE 
      WHEN lp.assigned_at IS NULL THEN NULL
      ELSE LEAST(FLOOR(EXTRACT(EPOCH FROM (NOW() - lp.assigned_at)) / 604800)::INT, 10)
    END AS plan_weeks_since_assignment,
    
    CASE 
      WHEN ap.client_id IS NULL THEN 'none'
      WHEN ap.usage_status = 'archived' THEN 'none'
      WHEN ap.expires_at IS NOT NULL AND ap.expires_at < NOW() THEN 'expired'
      WHEN (ap.total_sessions - ap.consumed_sessions) <= CEIL(ap.total_sessions * 0.2) THEN 'low'
      ELSE 'active'
    END AS package_status,
    
    CASE 
      WHEN ne.client_id IS NULL THEN 'unplanned'
      ELSE 'planned'
    END AS appointment_status,
    
    CASE 
      WHEN ls.ended_at IS NULL THEN 'inactive'
      WHEN EXTRACT(EPOCH FROM (NOW() - ls.ended_at)) / 86400 <= 7 THEN 'active'
      WHEN EXTRACT(EPOCH FROM (NOW() - ls.ended_at)) / 86400 <= 14 THEN 'low'
      ELSE 'inactive'
    END AS activity_status,
    
    ne.start_at AS next_appointment_date,
    
    (apc.client_id IS NOT NULL) AS has_active_plan
    
  FROM UNNEST(p_client_ids) AS c(id)
  LEFT JOIN active_plan_clients apc ON apc.client_id = c.id
  LEFT JOIN last_plans lp ON lp.client_id = c.id
  LEFT JOIN active_packages ap ON ap.client_id = c.id
  LEFT JOIN next_events ne ON ne.client_id = c.id
  LEFT JOIN last_sessions ls ON ls.client_id = c.id;
END;
$function$;

-- Indice composito per query filtri (client_id, status)
CREATE INDEX IF NOT EXISTS idx_cpa_client_id_status 
  ON client_plan_assignments (client_id, status);