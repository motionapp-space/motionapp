
-- 1. Update CHECK constraint to include new notification type
ALTER TABLE public.client_notifications DROP CONSTRAINT IF EXISTS client_notifications_type_check;
ALTER TABLE public.client_notifications ADD CONSTRAINT client_notifications_type_check 
  CHECK (type = ANY (ARRAY[
    'appointment_confirmed'::text,
    'appointment_canceled_by_coach'::text,
    'appointment_canceled_confirmed'::text,
    'counter_proposal_received'::text,
    'booking_request_canceled'::text,
    'booking_request_declined'::text,
    'plan_assigned'::text,
    'appointment_created_by_coach'::text
  ]));

-- 2. Add 'appointment_created_by_coach' to email_type enum
ALTER TYPE public.email_type ADD VALUE IF NOT EXISTS 'appointment_created_by_coach';

-- 3. Create trigger function for notifying client on coach-created events
CREATE OR REPLACE FUNCTION public.notify_client_event_created()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id uuid;
  v_coach_name text;
  v_formatted_date text;
BEGIN
  -- Only fire for coach-created events that are not canceled
  IF NEW.source IS DISTINCT FROM 'coach' THEN
    RETURN NEW;
  END IF;
  IF NEW.session_status = 'canceled' THEN
    RETURN NEW;
  END IF;

  -- Get client_id from coach_clients
  SELECT cc.client_id INTO v_client_id
  FROM public.coach_clients cc
  WHERE cc.id = NEW.coach_client_id;

  IF v_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get coach name
  SELECT COALESCE(u.first_name || ' ' || u.last_name, 'Il tuo coach') INTO v_coach_name
  FROM public.coach_clients cc
  JOIN public.users u ON u.id = cc.coach_id
  WHERE cc.id = NEW.coach_client_id;

  -- Format date for message
  v_formatted_date := to_char(NEW.start_at AT TIME ZONE 'Europe/Rome', 'DD/MM/YYYY "alle" HH24:MI');

  INSERT INTO public.client_notifications (client_id, type, title, message, related_id, related_type)
  VALUES (
    v_client_id,
    'appointment_created_by_coach',
    'Nuovo appuntamento',
    v_coach_name || ' ha fissato un appuntamento per il ' || v_formatted_date,
    NEW.id::text,
    'event'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create trigger
DROP TRIGGER IF EXISTS trg_notify_client_event_created ON public.events;
CREATE TRIGGER trg_notify_client_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_event_created();
