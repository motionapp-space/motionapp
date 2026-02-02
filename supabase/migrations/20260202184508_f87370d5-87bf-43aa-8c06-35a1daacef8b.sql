-- Fix typo: COUNTER_PROPOSAL → COUNTER_PROPOSED
CREATE OR REPLACE FUNCTION public.notify_client_counter_proposal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COUNTER_PROPOSED' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'COUNTER_PROPOSED') THEN
    INSERT INTO public.client_notifications (client_id, type, title, message, related_id, related_type)
    SELECT 
      cc.client_id,
      'counter_proposal_received',
      'Proposta nuovo orario',
      'Il coach propone: ' || to_char(NEW.counter_proposal_start_at AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI'),
      NEW.id,
      'booking_request'
    FROM public.coach_clients cc WHERE cc.id = NEW.coach_client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;