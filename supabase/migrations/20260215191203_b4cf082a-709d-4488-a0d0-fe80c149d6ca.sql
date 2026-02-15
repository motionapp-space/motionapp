
CREATE OR REPLACE FUNCTION public.notify_client_event_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_start text;
BEGIN
  IF NEW.source = 'coach' AND NEW.session_status IS DISTINCT FROM 'canceled' THEN
    SELECT cc.client_id INTO v_client_id
    FROM coach_clients cc
    WHERE cc.id = NEW.coach_client_id;

    IF v_client_id IS NOT NULL THEN
      v_start := to_char(NEW.start_at AT TIME ZONE 'Europe/Rome', 'DD/MM/YYYY HH24:MI');

      INSERT INTO client_notifications (client_id, type, title, message, related_id, related_type)
      VALUES (
        v_client_id,
        'appointment_created_by_coach',
        'Nuovo appuntamento',
        'Il tuo coach ha fissato un appuntamento per il ' || v_start,
        NEW.id,
        'event'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
