-- =============================================================================
-- FASE 1: BACKFILL coach_clients con tutti i client esistenti
-- =============================================================================

INSERT INTO coach_clients (coach_id, client_id, status, role)
SELECT c.coach_id, c.id, 'active', 'primary'
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM coach_clients cc 
  WHERE cc.coach_id = c.coach_id AND cc.client_id = c.id
);

-- =============================================================================
-- FASE 2: DROP TABELLE OBSOLETE
-- =============================================================================

DROP TABLE IF EXISTS package_consumptions CASCADE;
DROP TABLE IF EXISTS client_packages CASCADE;
DROP TABLE IF EXISTS package_types CASCADE;
DROP TABLE IF EXISTS measurement_types CASCADE;

-- =============================================================================
-- FASE 3: DROP TUTTE LE RLS POLICIES DIPENDENTI PRIMA DI RIMUOVERE COLONNE
-- =============================================================================

-- Package policies
DROP POLICY IF EXISTS "Coaches can view packages for their clients" ON package;
DROP POLICY IF EXISTS "Coaches can create packages for their clients" ON package;
DROP POLICY IF EXISTS "Coaches can update packages for their clients" ON package;
DROP POLICY IF EXISTS "Coaches can delete packages for their clients" ON package;

-- Package_ledger policies (dipende da package.coach_id)
DROP POLICY IF EXISTS "Coaches can view ledger for their packages" ON package_ledger;
DROP POLICY IF EXISTS "Coaches can create ledger entries for their packages" ON package_ledger;

-- Payment policies (dipende da package.coach_id)
DROP POLICY IF EXISTS "Coaches can view payments for their packages" ON payment;
DROP POLICY IF EXISTS "Coaches can create payments for their packages" ON payment;

-- Client_plans policies
DROP POLICY IF EXISTS "Coaches can create client plans for their clients" ON client_plans;
DROP POLICY IF EXISTS "Coaches can view client plans for their clients" ON client_plans;
DROP POLICY IF EXISTS "Coaches can update client plans for their clients" ON client_plans;
DROP POLICY IF EXISTS "Coaches can delete client plans for their clients" ON client_plans;
DROP POLICY IF EXISTS "Clients can view their own plans" ON client_plans;

-- Training_sessions policies
DROP POLICY IF EXISTS "Coaches can view their sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can create sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can update sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can delete sessions" ON training_sessions;
DROP POLICY IF EXISTS "Clients can view their own sessions" ON training_sessions;

-- Booking_requests policies
DROP POLICY IF EXISTS "Coaches can view booking requests for their clients" ON booking_requests;
DROP POLICY IF EXISTS "Coaches can create booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Coaches can update their booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Coaches can delete their booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Clients can view their own booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Clients can create their own booking requests" ON booking_requests;
DROP POLICY IF EXISTS "Clients can cancel their own booking requests" ON booking_requests;

-- Events policies
DROP POLICY IF EXISTS "Coaches can view their own events" ON events;
DROP POLICY IF EXISTS "Coaches can create events" ON events;
DROP POLICY IF EXISTS "Coaches can update their own events" ON events;
DROP POLICY IF EXISTS "Coaches can delete their own events" ON events;
DROP POLICY IF EXISTS "Clients can view their own events" ON events;
DROP POLICY IF EXISTS "Clients can update their events for proposals" ON events;

-- =============================================================================
-- FASE 4: MIGRAZIONE SCHEMA - Aggiungere coach_client_id a tutte le tabelle
-- =============================================================================

-- 4.1 PACKAGE
ALTER TABLE package ADD COLUMN IF NOT EXISTS coach_client_id uuid REFERENCES coach_clients(id);

UPDATE package p
SET coach_client_id = cc.id
FROM coach_clients cc
WHERE cc.coach_id = p.coach_id AND cc.client_id = p.client_id
AND p.coach_client_id IS NULL;

DELETE FROM package WHERE coach_client_id IS NULL;

ALTER TABLE package ALTER COLUMN coach_client_id SET NOT NULL;

ALTER TABLE package DROP COLUMN IF EXISTS coach_id CASCADE;
ALTER TABLE package DROP COLUMN IF EXISTS client_id CASCADE;

-- 4.2 CLIENT_PLANS
ALTER TABLE client_plans ADD COLUMN IF NOT EXISTS coach_client_id uuid REFERENCES coach_clients(id);

UPDATE client_plans cp
SET coach_client_id = cc.id
FROM coach_clients cc
WHERE cc.coach_id = cp.coach_id AND cc.client_id = cp.client_id
AND cp.coach_client_id IS NULL;

DELETE FROM client_plans WHERE coach_client_id IS NULL;

ALTER TABLE client_plans ALTER COLUMN coach_client_id SET NOT NULL;

ALTER TABLE client_plans DROP COLUMN IF EXISTS coach_id CASCADE;
ALTER TABLE client_plans DROP COLUMN IF EXISTS client_id CASCADE;

-- 4.3 TRAINING_SESSIONS
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS coach_client_id uuid REFERENCES coach_clients(id);

UPDATE training_sessions ts
SET coach_client_id = cc.id
FROM coach_clients cc
WHERE cc.coach_id = ts.coach_id AND cc.client_id = ts.client_id
AND ts.coach_client_id IS NULL;

DELETE FROM training_sessions WHERE coach_client_id IS NULL;

ALTER TABLE training_sessions ALTER COLUMN coach_client_id SET NOT NULL;

ALTER TABLE training_sessions DROP COLUMN IF EXISTS coach_id CASCADE;
ALTER TABLE training_sessions DROP COLUMN IF EXISTS client_id CASCADE;

-- 4.4 BOOKING_REQUESTS
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS coach_client_id uuid REFERENCES coach_clients(id);

UPDATE booking_requests br
SET coach_client_id = cc.id
FROM coach_clients cc
WHERE cc.coach_id = br.coach_id AND cc.client_id = br.client_id
AND br.coach_client_id IS NULL;

DELETE FROM booking_requests WHERE coach_client_id IS NULL;

ALTER TABLE booking_requests ALTER COLUMN coach_client_id SET NOT NULL;

ALTER TABLE booking_requests DROP COLUMN IF EXISTS coach_id CASCADE;
ALTER TABLE booking_requests DROP COLUMN IF EXISTS client_id CASCADE;

-- 4.5 EVENTS
ALTER TABLE events ADD COLUMN IF NOT EXISTS coach_client_id uuid REFERENCES coach_clients(id);

UPDATE events e
SET coach_client_id = cc.id
FROM coach_clients cc
WHERE cc.coach_id = e.coach_id AND cc.client_id = e.client_id
AND e.coach_client_id IS NULL;

DELETE FROM events WHERE coach_client_id IS NULL;

ALTER TABLE events ALTER COLUMN coach_client_id SET NOT NULL;

ALTER TABLE events DROP COLUMN IF EXISTS coach_id CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS client_id CASCADE;

-- =============================================================================
-- FASE 5: INDICI per performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_package_coach_client_id ON package(coach_client_id);
CREATE INDEX IF NOT EXISTS idx_client_plans_coach_client_id ON client_plans(coach_client_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_client_id ON training_sessions(coach_client_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_coach_client_id ON booking_requests(coach_client_id);
CREATE INDEX IF NOT EXISTS idx_events_coach_client_id ON events(coach_client_id);

-- =============================================================================
-- FASE 6: VIEW HELPER per semplificare le query
-- =============================================================================

CREATE OR REPLACE VIEW v_coach_client_details AS
SELECT 
  cc.id as coach_client_id,
  cc.coach_id,
  cc.client_id,
  cc.status as relationship_status,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  c.status as client_status
FROM coach_clients cc
JOIN clients c ON c.id = cc.client_id;

-- =============================================================================
-- FASE 7: CREAZIONE NUOVE RLS POLICIES con coach_client_id
-- =============================================================================

-- 7.1 PACKAGE
CREATE POLICY "Coaches can view packages" ON package
FOR SELECT USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can create packages" ON package
FOR INSERT WITH CHECK (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can update packages" ON package
FOR UPDATE USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can delete packages" ON package
FOR DELETE USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

-- 7.2 PACKAGE_LEDGER (ricreare con join su package -> coach_clients)
CREATE POLICY "Coaches can view ledger" ON package_ledger
FOR SELECT USING (
  package_id IN (
    SELECT p.package_id FROM package p
    WHERE p.coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
  )
);

CREATE POLICY "Coaches can create ledger entries" ON package_ledger
FOR INSERT WITH CHECK (
  package_id IN (
    SELECT p.package_id FROM package p
    WHERE p.coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
  )
);

-- 7.3 PAYMENT (ricreare con join su package -> coach_clients)
CREATE POLICY "Coaches can view payments" ON payment
FOR SELECT USING (
  package_id IN (
    SELECT p.package_id FROM package p
    WHERE p.coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
  )
);

CREATE POLICY "Coaches can create payments" ON payment
FOR INSERT WITH CHECK (
  package_id IN (
    SELECT p.package_id FROM package p
    WHERE p.coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
  )
);

-- 7.4 CLIENT_PLANS
CREATE POLICY "Coaches can view client plans" ON client_plans
FOR SELECT USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can create client plans" ON client_plans
FOR INSERT WITH CHECK (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can update client plans" ON client_plans
FOR UPDATE USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can delete client plans" ON client_plans
FOR DELETE USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Clients can view their own plans" ON client_plans
FOR SELECT USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.auth_user_id = auth.uid()
  )
);

-- 7.5 TRAINING_SESSIONS
CREATE POLICY "Coaches can view sessions" ON training_sessions
FOR SELECT USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can create sessions" ON training_sessions
FOR INSERT WITH CHECK (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can update sessions" ON training_sessions
FOR UPDATE USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can delete sessions" ON training_sessions
FOR DELETE USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Clients can view their sessions" ON training_sessions
FOR SELECT USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.auth_user_id = auth.uid()
  )
);

-- 7.6 BOOKING_REQUESTS
CREATE POLICY "Coaches can view booking requests" ON booking_requests
FOR SELECT USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can create booking requests" ON booking_requests
FOR INSERT WITH CHECK (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can update booking requests" ON booking_requests
FOR UPDATE USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can delete booking requests" ON booking_requests
FOR DELETE USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Clients can view their booking requests" ON booking_requests
FOR SELECT USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can create booking requests" ON booking_requests
FOR INSERT WITH CHECK (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can cancel booking requests" ON booking_requests
FOR UPDATE USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.auth_user_id = auth.uid()
  )
)
WITH CHECK (status = 'CANCELED_BY_CLIENT');

-- 7.7 EVENTS
CREATE POLICY "Coaches can view events" ON events
FOR SELECT USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can create events" ON events
FOR INSERT WITH CHECK (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can update events" ON events
FOR UPDATE USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Coaches can delete events" ON events
FOR DELETE USING (
  coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
);

CREATE POLICY "Clients can view their events" ON events
FOR SELECT USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can update events for proposals" ON events
FOR UPDATE USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.auth_user_id = auth.uid()
  )
);

-- =============================================================================
-- FASE 8: AGGIORNARE FUNZIONI che usano coach_id/client_id
-- =============================================================================

-- Aggiornare funzione notify_coach_autonomous_session
CREATE OR REPLACE FUNCTION public.notify_coach_autonomous_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  client_name TEXT;
  v_coach_id uuid;
BEGIN
  IF NEW.source = 'autonomous' AND NEW.status = 'completed' AND 
     (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    SELECT cc.coach_id, c.first_name || ' ' || c.last_name 
    INTO v_coach_id, client_name
    FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE cc.id = NEW.coach_client_id;
    
    INSERT INTO coach_notifications (
      coach_id, type, title, message, related_id, related_type
    ) VALUES (
      v_coach_id,
      'autonomous_session_completed',
      'Sessione autonoma completata',
      client_name || ' ha completato una sessione di allenamento',
      NEW.id,
      'session'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Aggiornare log_client_plan_activity
CREATE OR REPLACE FUNCTION public.log_client_plan_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_client_id uuid;
BEGIN
  SELECT client_id INTO v_client_id
  FROM coach_clients
  WHERE id = NEW.coach_client_id;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.client_activities (client_id, type, message)
    VALUES (v_client_id, 'UPDATED', 'Plan "' || NEW.name || '" assigned');
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO public.client_activities (client_id, type, message)
    VALUES (v_client_id, 'UPDATED', 'Plan "' || NEW.name || '" status changed to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$function$;

-- Aggiornare compute_client_table_data_batch
CREATE OR REPLACE FUNCTION public.compute_client_table_data_batch(p_client_ids uuid[])
RETURNS TABLE(client_id uuid, plan_weeks_since_assignment integer, package_status text, appointment_status text, activity_status text, next_appointment_date timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH 
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
    
    ne.start_at AS next_appointment_date
    
  FROM UNNEST(p_client_ids) AS c(id)
  LEFT JOIN last_plans lp ON lp.client_id = c.id
  LEFT JOIN active_packages ap ON ap.client_id = c.id
  LEFT JOIN next_events ne ON ne.client_id = c.id
  LEFT JOIN last_sessions ls ON ls.client_id = c.id;
END;
$function$;