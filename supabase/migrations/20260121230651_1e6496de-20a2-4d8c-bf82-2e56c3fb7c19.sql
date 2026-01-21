-- RPC to discard a training session with cleanup
-- Atomically: deletes all exercise_actuals and marks session as 'discarded'
-- Authorization: allows both client owner AND coach owner

CREATE OR REPLACE FUNCTION public.discard_training_session(p_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coach_client_id UUID;
  v_client_id UUID;
  v_coach_id UUID;
  v_requesting_user UUID;
  v_is_client BOOLEAN := FALSE;
  v_is_coach BOOLEAN := FALSE;
BEGIN
  v_requesting_user := auth.uid();
  
  IF v_requesting_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get session's coach_client_id
  SELECT coach_client_id INTO v_coach_client_id
  FROM training_sessions
  WHERE id = p_session_id;
  
  IF v_coach_client_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  
  -- Get client_id and coach_id from coach_clients
  SELECT client_id, coach_id 
  INTO v_client_id, v_coach_id
  FROM coach_clients
  WHERE id = v_coach_client_id;
  
  -- Check if user is the CLIENT owner
  IF EXISTS (
    SELECT 1 FROM clients 
    WHERE id = v_client_id AND user_id = v_requesting_user
  ) THEN
    v_is_client := TRUE;
  END IF;
  
  -- Check if user is the COACH owner
  -- (coaches.id = auth.uid() directly, no user_id column)
  IF v_coach_id = v_requesting_user THEN
    v_is_coach := TRUE;
  END IF;
  
  -- Authorize: must be client OR coach
  IF NOT (v_is_client OR v_is_coach) THEN
    RAISE EXCEPTION 'Not authorized to discard this session';
  END IF;
  
  -- Delete all actuals for this session (FK: session_id)
  DELETE FROM exercise_actuals WHERE session_id = p_session_id;
  
  -- Update session status to discarded
  UPDATE training_sessions
  SET status = 'discarded', ended_at = NOW()
  WHERE id = p_session_id;
END;
$$;