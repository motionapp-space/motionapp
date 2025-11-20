-- FASE 0: Database function per calcolo dati tabella clienti
-- Ottimizzata per performance con CTE e batch processing

CREATE OR REPLACE FUNCTION compute_client_table_data_batch(p_client_ids UUID[])
RETURNS TABLE(
  client_id UUID,
  plan_weeks_since_assignment INT,
  package_status TEXT,
  appointment_status TEXT,
  activity_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- CTE 1: Ultimo piano assegnato per ogni cliente
  last_plans AS (
    SELECT DISTINCT ON (cpa.client_id)
      cpa.client_id,
      cpa.assigned_at
    FROM client_plan_assignments cpa
    WHERE cpa.client_id = ANY(p_client_ids)
    ORDER BY cpa.client_id, cpa.assigned_at DESC
  ),
  
  -- CTE 2: Pacchetto attivo più recente
  active_packages AS (
    SELECT DISTINCT ON (p.client_id)
      p.client_id,
      p.consumed_sessions,
      p.total_sessions,
      p.expires_at,
      p.usage_status
    FROM package p
    WHERE p.client_id = ANY(p_client_ids)
      AND p.usage_status = 'active'
    ORDER BY p.client_id, p.created_at DESC
  ),
  
  -- CTE 3: Prossimo appuntamento futuro
  next_events AS (
    SELECT DISTINCT ON (e.client_id)
      e.client_id,
      e.start_at
    FROM events e
    WHERE e.client_id = ANY(p_client_ids)
      AND e.start_at > NOW()
    ORDER BY e.client_id, e.start_at ASC
  ),
  
  -- CTE 4: Ultima sessione completata
  last_sessions AS (
    SELECT DISTINCT ON (ts.client_id)
      ts.client_id,
      ts.ended_at
    FROM training_sessions ts
    WHERE ts.client_id = ANY(p_client_ids)
      AND ts.status = 'completed'
    ORDER BY ts.client_id, ts.ended_at DESC
  )
  
  SELECT 
    c.id AS client_id,
    
    -- Calcolo settimane dall'ultimo piano (cap a 10)
    CASE 
      WHEN lp.assigned_at IS NULL THEN NULL
      ELSE LEAST(FLOOR(EXTRACT(EPOCH FROM (NOW() - lp.assigned_at)) / 604800)::INT, 10)
    END AS plan_weeks_since_assignment,
    
    -- Stato pacchetto (active/low/expired/none)
    CASE 
      WHEN ap.client_id IS NULL THEN 'none'
      WHEN ap.usage_status = 'archived' THEN 'none'
      WHEN ap.expires_at IS NOT NULL AND ap.expires_at < NOW() THEN 'expired'
      WHEN (ap.total_sessions - ap.consumed_sessions) <= CEIL(ap.total_sessions * 0.2) THEN 'low'
      ELSE 'active'
    END AS package_status,
    
    -- Stato appuntamenti (planned/unplanned)
    CASE 
      WHEN ne.client_id IS NULL THEN 'unplanned'
      ELSE 'planned'
    END AS appointment_status,
    
    -- Stato attività (active: ≤7gg, low: ≤14gg, inactive: >14gg)
    CASE 
      WHEN ls.ended_at IS NULL THEN 'inactive'
      WHEN EXTRACT(EPOCH FROM (NOW() - ls.ended_at)) / 86400 <= 7 THEN 'active'
      WHEN EXTRACT(EPOCH FROM (NOW() - ls.ended_at)) / 86400 <= 14 THEN 'low'
      ELSE 'inactive'
    END AS activity_status
    
  FROM UNNEST(p_client_ids) AS c(id)
  LEFT JOIN last_plans lp ON lp.client_id = c.id
  LEFT JOIN active_packages ap ON ap.client_id = c.id
  LEFT JOIN next_events ne ON ne.client_id = c.id
  LEFT JOIN last_sessions ls ON ls.client_id = c.id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;