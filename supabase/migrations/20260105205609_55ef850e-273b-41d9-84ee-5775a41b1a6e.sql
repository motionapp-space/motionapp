
-- Fix: Modifica il trigger validate_client_event_update per permettere update da service_role/cron

CREATE OR REPLACE FUNCTION validate_client_event_update()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id uuid;
  v_client_user_id uuid;
  v_current_user uuid;
BEGIN
  v_current_user := auth.uid();
  
  -- Se auth.uid() è NULL (es. service_role, cron, RPC SECURITY DEFINER), permetti l'update
  IF v_current_user IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT cc.coach_id, c.user_id
  INTO v_coach_id, v_client_user_id
  FROM public.coach_clients cc
  JOIN public.clients c ON c.id = cc.client_id
  WHERE cc.id = OLD.coach_client_id;

  IF v_coach_id = v_current_user THEN
    RETURN NEW;
  END IF;

  IF v_client_user_id = v_current_user THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
