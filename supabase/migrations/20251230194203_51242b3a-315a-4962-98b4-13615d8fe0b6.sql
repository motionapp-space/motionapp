-- =============================================================================
-- ATOMIC MIGRATION: Drop ALL policies, then columns, then recreate
-- =============================================================================

-- STEP 1: DROP ALL POLICIES that reference auth_user_id or coach_id (on clients)

-- Policies on clients table
DROP POLICY IF EXISTS "Clients can view own profile" ON public.clients;
DROP POLICY IF EXISTS "Coaches can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Coaches can create clients" ON public.clients;
DROP POLICY IF EXISTS "Coaches can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Coaches can delete their own clients" ON public.clients;

-- Policies on availability_windows
DROP POLICY IF EXISTS "Clients can view availability windows of their coach" ON public.availability_windows;

-- Policies on booking_settings
DROP POLICY IF EXISTS "Clients can view booking settings of their coach" ON public.booking_settings;

-- Policies on booking_requests (all client policies)
DROP POLICY IF EXISTS "Clients can view their booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Clients can create booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Clients can cancel booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Clients can accept counter proposals" ON public.booking_requests;

-- Policies on client_plans
DROP POLICY IF EXISTS "Clients can view their own plans" ON public.client_plans;

-- Policies on coach_clients
DROP POLICY IF EXISTS "Clients can view own coach relationship" ON public.coach_clients;
DROP POLICY IF EXISTS "Coaches can view relationships for their clients" ON public.coach_clients;

-- Policies on events
DROP POLICY IF EXISTS "Clients can view their own events" ON public.events;
DROP POLICY IF EXISTS "Clients can update their own events" ON public.events;
DROP POLICY IF EXISTS "Clients can view their events" ON public.events;
DROP POLICY IF EXISTS "Clients can update events for proposals" ON public.events;

-- Policies on exercise_actuals
DROP POLICY IF EXISTS "Clients can view own exercise actuals" ON public.exercise_actuals;

-- Policies on training_sessions
DROP POLICY IF EXISTS "Clients can view their sessions" ON public.training_sessions;

-- Policies on client_activities
DROP POLICY IF EXISTS "Coaches can create activities for their clients" ON public.client_activities;
DROP POLICY IF EXISTS "Coaches can view activities for their clients" ON public.client_activities;

-- Policies on client_plan_assignments
DROP POLICY IF EXISTS "Coaches can create assignments for their clients" ON public.client_plan_assignments;
DROP POLICY IF EXISTS "Coaches can delete assignments for their clients" ON public.client_plan_assignments;
DROP POLICY IF EXISTS "Coaches can update assignments for their clients" ON public.client_plan_assignments;
DROP POLICY IF EXISTS "Coaches can view assignments for their clients" ON public.client_plan_assignments;

-- Policies on client_state_logs
DROP POLICY IF EXISTS "Coaches can view state logs for their clients" ON public.client_state_logs;
DROP POLICY IF EXISTS "Coaches can view logs for their clients" ON public.client_state_logs;
DROP POLICY IF EXISTS "Coaches can view plan logs for their clients" ON public.client_state_logs;

-- Policies on client_tag_on_client
DROP POLICY IF EXISTS "Coaches can add tags to their clients" ON public.client_tag_on_client;
DROP POLICY IF EXISTS "Coaches can remove tags from their clients" ON public.client_tag_on_client;
DROP POLICY IF EXISTS "Coaches can view tags for their clients" ON public.client_tag_on_client;

-- Policies on measurements
DROP POLICY IF EXISTS "Coaches can create measurements for their clients" ON public.measurements;
DROP POLICY IF EXISTS "Coaches can delete measurements for their clients" ON public.measurements;
DROP POLICY IF EXISTS "Coaches can update measurements for their clients" ON public.measurements;
DROP POLICY IF EXISTS "Coaches can view measurements for their clients" ON public.measurements;

-- Policies on plan_state_logs
DROP POLICY IF EXISTS "Coaches can view plan logs for their clients" ON public.plan_state_logs;

-- Policies on users
DROP POLICY IF EXISTS "Coaches can view client profiles" ON public.users;

-- =============================================================================
-- STEP 2: DROP COLUMNS
-- =============================================================================

-- Remove duplicate columns from coaches
ALTER TABLE public.coaches DROP COLUMN IF EXISTS email;
ALTER TABLE public.coaches DROP COLUMN IF EXISTS name;
ALTER TABLE public.coaches DROP COLUMN IF EXISTS avatar_url;

-- Remove auth_user_id from clients (replaced by user_id)
ALTER TABLE public.clients DROP COLUMN IF EXISTS auth_user_id;

-- Remove coach_id from clients (relationship now in coach_clients)
ALTER TABLE public.clients DROP COLUMN IF EXISTS coach_id;

-- =============================================================================
-- STEP 3: RECREATE ALL POLICIES USING user_id and coach_clients
-- =============================================================================

-- clients - client can view own profile (using user_id)
CREATE POLICY "Clients can view own profile"
ON public.clients FOR SELECT
USING (user_id = auth.uid());

-- clients - coach policies using coach_clients
CREATE POLICY "Coaches can create clients"
ON public.clients FOR INSERT
WITH CHECK (true);

CREATE POLICY "Coaches can view their own clients"
ON public.clients FOR SELECT
USING (
  id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update their own clients"
ON public.clients FOR UPDATE
USING (
  id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete their own clients"
ON public.clients FOR DELETE
USING (
  id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

-- availability_windows
CREATE POLICY "Clients can view availability windows of their coach"
ON public.availability_windows FOR SELECT
USING (coach_id IN (
  SELECT cc.coach_id FROM coach_clients cc
  JOIN clients c ON c.id = cc.client_id
  WHERE c.user_id = auth.uid() AND cc.status = 'active'
));

-- booking_settings
CREATE POLICY "Clients can view booking settings of their coach"
ON public.booking_settings FOR SELECT
USING (coach_id IN (
  SELECT cc.coach_id FROM coach_clients cc
  JOIN clients c ON c.id = cc.client_id
  WHERE c.user_id = auth.uid() AND cc.status = 'active'
));

-- booking_requests
CREATE POLICY "Clients can view their booking requests"
ON public.booking_requests FOR SELECT
USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can create booking requests"
ON public.booking_requests FOR INSERT
WITH CHECK (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can cancel booking requests"
ON public.booking_requests FOR UPDATE
USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
)
WITH CHECK (status = 'CANCELED_BY_CLIENT'::booking_request_status);

CREATE POLICY "Clients can accept counter proposals"
ON public.booking_requests FOR UPDATE
USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  ) AND status = 'COUNTER_PROPOSED'::booking_request_status
)
WITH CHECK (status = 'APPROVED'::booking_request_status);

-- client_plans
CREATE POLICY "Clients can view their own plans"
ON public.client_plans FOR SELECT
USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- coach_clients
CREATE POLICY "Clients can view own coach relationship"
ON public.coach_clients FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can view relationships for their clients"
ON public.coach_clients FOR SELECT
USING (
  auth.uid() = coach_id
);

-- events
CREATE POLICY "Clients can view their own events"
ON public.events FOR SELECT
USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can update their own events"
ON public.events FOR UPDATE
USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- exercise_actuals
CREATE POLICY "Clients can view own exercise actuals"
ON public.exercise_actuals FOR SELECT
USING (
  session_id IN (
    SELECT ts.id FROM training_sessions ts
    JOIN coach_clients cc ON cc.id = ts.coach_client_id
    JOIN clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- training_sessions
CREATE POLICY "Clients can view their sessions"
ON public.training_sessions FOR SELECT
USING (
  coach_client_id IN (
    SELECT cc.id FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- client_activities
CREATE POLICY "Coaches can create activities for their clients"
ON public.client_activities FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid() AND cc.status = 'active'
  )
);

CREATE POLICY "Coaches can view activities for their clients"
ON public.client_activities FOR SELECT
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

-- client_plan_assignments
CREATE POLICY "Coaches can create assignments for their clients"
ON public.client_plan_assignments FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid() AND cc.status = 'active'
  )
);

CREATE POLICY "Coaches can delete assignments for their clients"
ON public.client_plan_assignments FOR DELETE
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update assignments for their clients"
ON public.client_plan_assignments FOR UPDATE
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can view assignments for their clients"
ON public.client_plan_assignments FOR SELECT
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

-- client_state_logs
CREATE POLICY "Coaches can view state logs for their clients"
ON public.client_state_logs FOR SELECT
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

-- client_tag_on_client
CREATE POLICY "Coaches can add tags to their clients"
ON public.client_tag_on_client FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid() AND cc.status = 'active'
  )
);

CREATE POLICY "Coaches can remove tags from their clients"
ON public.client_tag_on_client FOR DELETE
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can view tags for their clients"
ON public.client_tag_on_client FOR SELECT
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

-- measurements
CREATE POLICY "Coaches can create measurements for their clients"
ON public.measurements FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid() AND cc.status = 'active'
  )
);

CREATE POLICY "Coaches can delete measurements for their clients"
ON public.measurements FOR DELETE
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update measurements for their clients"
ON public.measurements FOR UPDATE
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can view measurements for their clients"
ON public.measurements FOR SELECT
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

-- plan_state_logs
CREATE POLICY "Coaches can view plan logs for their clients"
ON public.plan_state_logs FOR SELECT
USING (
  client_id IN (
    SELECT cc.client_id FROM coach_clients cc
    WHERE cc.coach_id = auth.uid()
  )
);

-- users
CREATE POLICY "Coaches can view client profiles"
ON public.users FOR SELECT
USING (
  has_role(auth.uid(), 'coach'::app_role) AND 
  id IN (
    SELECT c.user_id FROM clients c
    JOIN coach_clients cc ON cc.client_id = c.id
    WHERE cc.coach_id = auth.uid() AND c.user_id IS NOT NULL
  )
);

-- =============================================================================
-- STEP 4: UPDATE DATABASE FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_coach_occupied_slots(p_coach_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
RETURNS TABLE(start_at timestamp with time zone, end_at timestamp with time zone, slot_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM clients c
    JOIN coach_clients cc ON cc.client_id = c.id
    WHERE c.user_id = auth.uid()
    AND cc.coach_id = p_coach_id
    AND cc.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this coach slots';
  END IF;

  RETURN QUERY
  SELECT 
    e.start_at,
    e.end_at,
    'event'::text as slot_type
  FROM events e
  JOIN coach_clients cc ON cc.id = e.coach_client_id
  WHERE cc.coach_id = p_coach_id
    AND e.session_status IS DISTINCT FROM 'canceled'
    AND e.start_at >= p_start_date
    AND e.start_at <= p_end_date

  UNION ALL

  SELECT 
    br.requested_start_at as start_at,
    br.requested_end_at as end_at,
    'pending_request'::text as slot_type
  FROM booking_requests br
  JOIN coach_clients cc ON cc.id = br.coach_client_id
  WHERE cc.coach_id = p_coach_id
    AND br.status = 'PENDING'
    AND br.requested_start_at >= p_start_date
    AND br.requested_start_at <= p_end_date;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_client_event_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_coach_id uuid;
  v_client_user_id uuid;
BEGIN
  SELECT cc.coach_id, c.user_id
  INTO v_coach_id, v_client_user_id
  FROM public.coach_clients cc
  JOIN public.clients c ON c.id = cc.client_id
  WHERE cc.id = OLD.coach_client_id;

  IF v_coach_id = auth.uid() THEN
    RETURN NEW;
  END IF;

  IF v_client_user_id = auth.uid() THEN
    IF NEW.coach_client_id IS DISTINCT FROM OLD.coach_client_id THEN
      RAISE EXCEPTION 'Client cannot modify coach_client_id';
    END IF;
    
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      RAISE EXCEPTION 'Client cannot modify title';
    END IF;
    
    IF NEW.location IS DISTINCT FROM OLD.location THEN
      RAISE EXCEPTION 'Client cannot modify location';
    END IF;
    
    IF (NEW.start_at IS DISTINCT FROM OLD.start_at OR NEW.end_at IS DISTINCT FROM OLD.end_at) THEN
      IF OLD.proposal_status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Client can only modify times when accepting a proposal';
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RAISE EXCEPTION 'Not authorized to update this event';
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_coach_appointment_canceled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  client_name TEXT;
  v_coach_id uuid;
  v_event_start timestamp with time zone;
BEGIN
  IF NEW.session_status = 'canceled' 
     AND (OLD.session_status IS NULL OR OLD.session_status != 'canceled') THEN
    
    SELECT cc.coach_id, c.first_name || ' ' || c.last_name, NEW.start_at
    INTO v_coach_id, client_name, v_event_start
    FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE cc.id = NEW.coach_client_id;
    
    INSERT INTO coach_notifications (
      coach_id, type, title, message, related_id, related_type
    ) VALUES (
      v_coach_id,
      'appointment_canceled_by_client',
      'Appuntamento annullato',
      client_name || ' ha annullato l''appuntamento del ' || 
        to_char(v_event_start AT TIME ZONE 'Europe/Rome', 'DD/MM/YYYY "alle" HH24:MI'),
      NEW.id,
      'event'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;