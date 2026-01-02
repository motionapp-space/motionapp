-- Migration 2: Create finalize_booking_request RPC
-- Atomic function to approve a booking request and create the corresponding event

CREATE OR REPLACE FUNCTION public.finalize_booking_request(p_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request booking_requests%ROWTYPE;
  v_coach_id uuid;
  v_client_user_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_event_id uuid;
  v_conflicts integer;
BEGIN
  -- Lock the row to prevent concurrent modifications
  SELECT * INTO v_request
  FROM booking_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking request not found';
  END IF;

  -- Get coach_id and client user_id for auth check
  SELECT cc.coach_id, c.user_id
  INTO v_coach_id, v_client_user_id
  FROM coach_clients cc
  JOIN clients c ON c.id = cc.client_id
  WHERE cc.id = v_request.coach_client_id;

  -- Auth check: caller must be coach or client
  IF auth.uid() != v_coach_id AND auth.uid() != v_client_user_id THEN
    RAISE EXCEPTION 'Not authorized to finalize this request';
  END IF;

  -- Idempotency: if already APPROVED with event_id, return existing event_id
  IF v_request.status = 'APPROVED' AND v_request.event_id IS NOT NULL THEN
    RETURN v_request.event_id;
  END IF;

  -- Status check: only PENDING and COUNTER_PROPOSED can be finalized
  IF v_request.status NOT IN ('PENDING', 'COUNTER_PROPOSED') THEN
    RAISE EXCEPTION 'Request not finalizable';
  END IF;

  -- Determine final slot based on status
  IF v_request.status = 'COUNTER_PROPOSED' THEN
    -- For COUNTER_PROPOSED, counter_proposal times MUST be set
    IF v_request.counter_proposal_start_at IS NULL OR v_request.counter_proposal_end_at IS NULL THEN
      RAISE EXCEPTION 'Counter proposal times required';
    END IF;
    v_start := v_request.counter_proposal_start_at;
    v_end := v_request.counter_proposal_end_at;
  ELSE
    -- For PENDING, use requested times
    v_start := v_request.requested_start_at;
    v_end := v_request.requested_end_at;
  END IF;

  -- Conflict check 1: Existing events (non-canceled) with overlapping time range
  SELECT COUNT(*) INTO v_conflicts
  FROM events e
  JOIN coach_clients cc ON cc.id = e.coach_client_id
  WHERE cc.coach_id = v_coach_id
    AND e.session_status IS DISTINCT FROM 'canceled'
    AND tstzrange(e.start_at, e.end_at, '[)') && tstzrange(v_start, v_end, '[)');

  IF v_conflicts > 0 THEN
    RAISE EXCEPTION 'Slot non disponibile';
  END IF;

  -- Conflict check 2: Other booking requests (PENDING or COUNTER_PROPOSED) with overlapping time range
  SELECT COUNT(*) INTO v_conflicts
  FROM booking_requests br2
  JOIN coach_clients cc2 ON cc2.id = br2.coach_client_id
  WHERE cc2.coach_id = v_coach_id
    AND br2.id != p_request_id
    AND br2.status IN ('PENDING', 'COUNTER_PROPOSED')
    AND tstzrange(
      CASE WHEN br2.status = 'COUNTER_PROPOSED' 
           THEN br2.counter_proposal_start_at 
           ELSE br2.requested_start_at END,
      CASE WHEN br2.status = 'COUNTER_PROPOSED' 
           THEN br2.counter_proposal_end_at 
           ELSE br2.requested_end_at END,
      '[)'
    ) && tstzrange(v_start, v_end, '[)');

  IF v_conflicts > 0 THEN
    RAISE EXCEPTION 'Slot non disponibile';
  END IF;

  -- Create the event
  INSERT INTO events (
    coach_client_id,
    start_at,
    end_at,
    title,
    session_status,
    source
  ) VALUES (
    v_request.coach_client_id,
    v_start,
    v_end,
    'Appuntamento',
    'scheduled',
    'client'
  )
  RETURNING id INTO v_event_id;

  -- Update the booking request
  UPDATE booking_requests
  SET 
    status = 'APPROVED',
    approved_at = now(),
    finalized_start_at = v_start,
    finalized_end_at = v_end,
    event_id = v_event_id,
    updated_at = now()
  WHERE id = p_request_id;

  RETURN v_event_id;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.finalize_booking_request(uuid) IS 'Atomically approves a booking request and creates the corresponding calendar event. Handles conflict detection and idempotency.';