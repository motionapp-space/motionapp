-- Migration 3: Fix get_coach_occupied_slots to use tstzrange overlap
-- PENDING uses requested_*, COUNTER_PROPOSED uses ONLY counter_proposal_* (NO COALESCE)
-- APPROVED is NOT included (now creates event immediately via finalize_booking_request)

CREATE OR REPLACE FUNCTION public.get_coach_occupied_slots(
  p_coach_id uuid, 
  p_start_date timestamp with time zone, 
  p_end_date timestamp with time zone
)
RETURNS TABLE(
  start_at timestamp with time zone, 
  end_at timestamp with time zone, 
  slot_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auth check: caller must be a client of this coach
  IF NOT EXISTS (
    SELECT 1 FROM clients c
    JOIN coach_clients cc ON cc.client_id = c.id
    WHERE c.user_id = auth.uid()
    AND cc.coach_id = p_coach_id
    AND cc.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this coach slots';
  END IF;

  RETURN QUERY
  -- Events: non-canceled events with overlapping time range
  SELECT 
    e.start_at,
    e.end_at,
    'event'::text as slot_type
  FROM events e
  JOIN coach_clients cc ON cc.id = e.coach_client_id
  WHERE cc.coach_id = p_coach_id
    AND e.session_status IS DISTINCT FROM 'canceled'
    AND tstzrange(e.start_at, e.end_at, '[)') && tstzrange(p_start_date, p_end_date, '[)')

  UNION ALL

  -- PENDING booking requests: use requested_* with overlap check
  SELECT 
    br.requested_start_at as start_at,
    br.requested_end_at as end_at,
    'pending_request'::text as slot_type
  FROM booking_requests br
  JOIN coach_clients cc ON cc.id = br.coach_client_id
  WHERE cc.coach_id = p_coach_id
    AND br.status = 'PENDING'
    AND tstzrange(br.requested_start_at, br.requested_end_at, '[)') 
        && tstzrange(p_start_date, p_end_date, '[)')

  UNION ALL

  -- COUNTER_PROPOSED booking requests: use ONLY counter_proposal_* (NO COALESCE, NOT NULL required)
  SELECT 
    br.counter_proposal_start_at as start_at,
    br.counter_proposal_end_at as end_at,
    'counter_proposed'::text as slot_type
  FROM booking_requests br
  JOIN coach_clients cc ON cc.id = br.coach_client_id
  WHERE cc.coach_id = p_coach_id
    AND br.status = 'COUNTER_PROPOSED'
    AND br.counter_proposal_start_at IS NOT NULL
    AND br.counter_proposal_end_at IS NOT NULL
    AND tstzrange(br.counter_proposal_start_at, br.counter_proposal_end_at, '[)') 
        && tstzrange(p_start_date, p_end_date, '[)');
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_coach_occupied_slots(uuid, timestamptz, timestamptz) IS 'Returns occupied time slots for a coach. PENDING blocks requested_*, COUNTER_PROPOSED blocks ONLY counter_proposal_* (no fallback). APPROVED is not included as it creates events immediately.';