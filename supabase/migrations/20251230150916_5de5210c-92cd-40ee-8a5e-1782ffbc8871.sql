-- Trigger per notificare il coach quando un client annulla un appuntamento
CREATE OR REPLACE FUNCTION public.notify_coach_appointment_canceled()
RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
  v_coach_id uuid;
  v_event_start timestamp with time zone;
BEGIN
  -- Attiva solo quando session_status cambia a 'canceled'
  IF NEW.session_status = 'canceled' 
     AND (OLD.session_status IS NULL OR OLD.session_status != 'canceled') THEN
    
    -- Recupera coach_id, nome cliente e data evento
    SELECT cc.coach_id, c.first_name || ' ' || c.last_name, NEW.start_at
    INTO v_coach_id, client_name, v_event_start
    FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE cc.id = NEW.coach_client_id;
    
    -- Crea notifica per il coach
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crea trigger sulla tabella events
DROP TRIGGER IF EXISTS on_appointment_canceled ON public.events;
CREATE TRIGGER on_appointment_canceled
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_coach_appointment_canceled();