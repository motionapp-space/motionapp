-- Create function to get all occupied slots for a coach (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_coach_occupied_slots(
  p_coach_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE (
  start_at timestamptz,
  end_at timestamptz,
  slot_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user is a client of this coach
  IF NOT EXISTS (
    SELECT 1 FROM clients c
    WHERE c.auth_user_id = auth.uid()
    AND c.coach_id = p_coach_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this coach slots';
  END IF;

  RETURN QUERY
  -- Existing events (all clients of the coach)
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

  -- Pending booking requests (all clients of the coach)
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
$$;