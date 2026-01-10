-- Drop existing constraint if exists
ALTER TABLE coach_notifications DROP CONSTRAINT IF EXISTS coach_notifications_type_check;

-- Add updated constraint with new notification types
ALTER TABLE coach_notifications ADD CONSTRAINT coach_notifications_type_check 
  CHECK (type = ANY (ARRAY[
    'autonomous_session_completed', 
    'client_message', 
    'plan_completed', 
    'appointment_canceled_by_client',
    'booking_approved',
    'booking_requested',
    'booking_rejected',
    'counter_proposal_accepted',
    'counter_proposal_rejected'
  ]));

-- =============================================================================
-- TRIGGER 1: notify_coach_booking_requested
-- Fires when a client creates a new booking request
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_coach_booking_requested()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coach_id uuid;
  v_client_name text;
BEGIN
  -- Get coach_id and client name
  SELECT cc.coach_id, c.first_name || ' ' || c.last_name
  INTO v_coach_id, v_client_name
  FROM coach_clients cc
  JOIN clients c ON c.id = cc.client_id
  WHERE cc.id = NEW.coach_client_id;
  
  INSERT INTO coach_notifications (coach_id, type, title, message, related_id, related_type)
  VALUES (
    v_coach_id,
    'booking_requested',
    'Nuova richiesta appuntamento',
    v_client_name || ' · ' || to_char(NEW.requested_start_at AT TIME ZONE 'Europe/Rome', 'Dy DD Mon "alle" HH24:MI'),
    NEW.id,
    'booking_request'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_requested ON booking_requests;
CREATE TRIGGER on_booking_requested
AFTER INSERT ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION notify_coach_booking_requested();

-- =============================================================================
-- TRIGGER 2: notify_coach_booking_rejected
-- Fires when coach declines a booking request (status -> DECLINED)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_coach_booking_rejected()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coach_id uuid;
  v_client_name text;
BEGIN
  IF NEW.status = 'DECLINED' AND OLD.status IS DISTINCT FROM 'DECLINED' THEN
    SELECT cc.coach_id, c.first_name || ' ' || c.last_name
    INTO v_coach_id, v_client_name
    FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE cc.id = NEW.coach_client_id;
    
    INSERT INTO coach_notifications (coach_id, type, title, message, related_id, related_type)
    VALUES (
      v_coach_id,
      'booking_rejected',
      'Richiesta rifiutata',
      'Hai rifiutato la richiesta di ' || v_client_name,
      NEW.id,
      'booking_request'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_rejected ON booking_requests;
CREATE TRIGGER on_booking_rejected
AFTER UPDATE ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION notify_coach_booking_rejected();

-- =============================================================================
-- TRIGGER 3: notify_coach_counter_proposal_response
-- Fires when client responds to a counter proposal (accepts or rejects)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_coach_counter_proposal_response()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coach_id uuid;
  v_client_name text;
  v_notification_type text;
  v_title text;
  v_message text;
BEGIN
  -- Counter proposal accepted (COUNTER_PROPOSED -> APPROVED)
  IF NEW.status = 'APPROVED' AND OLD.status = 'COUNTER_PROPOSED' THEN
    v_notification_type := 'counter_proposal_accepted';
    v_title := 'Controproposta accettata';
    
    SELECT cc.coach_id, c.first_name || ' ' || c.last_name
    INTO v_coach_id, v_client_name
    FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE cc.id = NEW.coach_client_id;
    
    v_message := v_client_name || ' ha accettato la tua controproposta';
    
    INSERT INTO coach_notifications (coach_id, type, title, message, related_id, related_type)
    VALUES (v_coach_id, v_notification_type, v_title, v_message, NEW.id, 'booking_request');
  
  -- Counter proposal rejected (COUNTER_PROPOSED -> CANCELED_BY_CLIENT)
  ELSIF NEW.status = 'CANCELED_BY_CLIENT' AND OLD.status = 'COUNTER_PROPOSED' THEN
    v_notification_type := 'counter_proposal_rejected';
    v_title := 'Controproposta rifiutata';
    
    SELECT cc.coach_id, c.first_name || ' ' || c.last_name
    INTO v_coach_id, v_client_name
    FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE cc.id = NEW.coach_client_id;
    
    v_message := v_client_name || ' ha rifiutato la tua controproposta';
    
    INSERT INTO coach_notifications (coach_id, type, title, message, related_id, related_type)
    VALUES (v_coach_id, v_notification_type, v_title, v_message, NEW.id, 'booking_request');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_counter_proposal_response ON booking_requests;
CREATE TRIGGER on_counter_proposal_response
AFTER UPDATE ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION notify_coach_counter_proposal_response();