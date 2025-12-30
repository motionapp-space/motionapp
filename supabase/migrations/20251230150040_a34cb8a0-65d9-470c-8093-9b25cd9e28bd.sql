-- Fix: Ricrea validate_client_event_update per usare coach_client_id invece di coach_id/client_id
CREATE OR REPLACE FUNCTION public.validate_client_event_update()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id uuid;
  v_client_auth_id uuid;
BEGIN
  -- Ottieni coach_id e client auth_user_id dal coach_client
  SELECT cc.coach_id, c.auth_user_id
  INTO v_coach_id, v_client_auth_id
  FROM public.coach_clients cc
  JOIN public.clients c ON c.id = cc.client_id
  WHERE cc.id = OLD.coach_client_id;

  -- Se l'utente è il coach (owner), permetti tutto
  IF v_coach_id = auth.uid() THEN
    RETURN NEW;
  END IF;

  -- Se l'utente è il client autenticato
  IF v_client_auth_id = auth.uid() THEN
    -- Valida che non stia modificando campi non autorizzati
    
    -- coach_client_id non può essere modificato
    IF NEW.coach_client_id IS DISTINCT FROM OLD.coach_client_id THEN
      RAISE EXCEPTION 'Client cannot modify coach_client_id';
    END IF;
    
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      RAISE EXCEPTION 'Client cannot modify title';
    END IF;
    
    IF NEW.location IS DISTINCT FROM OLD.location THEN
      RAISE EXCEPTION 'Client cannot modify location';
    END IF;
    
    -- Se sta cambiando start_at o end_at, deve essere per accettare una proposta
    IF (NEW.start_at IS DISTINCT FROM OLD.start_at OR NEW.end_at IS DISTINCT FROM OLD.end_at) THEN
      IF OLD.proposal_status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Client can only modify times when accepting a proposal';
      END IF;
    END IF;
    
    -- Permetti update session_status (per cancellazione)
    -- Permetti update proposal_status (per accettare/rifiutare proposta)
    
    RETURN NEW;
  END IF;
  
  -- Utente non autorizzato
  RAISE EXCEPTION 'Not authorized to update this event';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;