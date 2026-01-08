-- 1. Add columns to booking_requests for economic choice
ALTER TABLE booking_requests 
  ADD COLUMN IF NOT EXISTS economic_type text NOT NULL DEFAULT 'single_paid',
  ADD COLUMN IF NOT EXISTS selected_package_id uuid NULL;

-- 2. Constraint: economic_type must be valid
ALTER TABLE booking_requests
  ADD CONSTRAINT chk_booking_requests_economic_type 
  CHECK (economic_type IN ('package', 'single_paid'));

-- 3. Constraint: coerenza economic_type ↔ selected_package_id
ALTER TABLE booking_requests
  ADD CONSTRAINT chk_booking_requests_economic_refs
  CHECK (
    (economic_type = 'package' AND selected_package_id IS NOT NULL)
    OR
    (economic_type = 'single_paid' AND selected_package_id IS NULL)
  );

-- 4. FK to package
ALTER TABLE booking_requests
  ADD CONSTRAINT fk_booking_requests_selected_package
  FOREIGN KEY (selected_package_id) REFERENCES package(package_id) ON DELETE SET NULL;

-- 5. RLS policy for clients to view their own packages
CREATE POLICY "Clients can view own packages"
  ON package FOR SELECT
  USING (
    coach_client_id IN (
      SELECT cc.id
      FROM coach_clients cc
      JOIN clients c ON c.id = cc.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- 6. Update finalize_booking_request to respect client's economic choice
CREATE OR REPLACE FUNCTION finalize_booking_request(p_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request booking_requests%ROWTYPE;
  v_coach_id uuid;
  v_client_user_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_event_id uuid;
  v_conflicts integer;
  v_package_id uuid;
  v_final_economic_type text;
  v_coach_client_id uuid;
  v_default_price int;
  v_pkg package%ROWTYPE;
  v_client_name text;
BEGIN
  -- Lock the request row
  SELECT * INTO v_request FROM booking_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking request not found'; END IF;

  v_coach_client_id := v_request.coach_client_id;

  -- Get coach and client info for auth check
  SELECT cc.coach_id, c.user_id, c.first_name || ' ' || c.last_name
  INTO v_coach_id, v_client_user_id, v_client_name
  FROM coach_clients cc
  JOIN clients c ON c.id = cc.client_id
  WHERE cc.id = v_coach_client_id;

  -- Auth check: only coach or client can finalize
  IF auth.uid() != v_coach_id AND auth.uid() != v_client_user_id THEN
    RAISE EXCEPTION 'Not authorized to finalize this request';
  END IF;

  -- Idempotency: if already approved, return existing event_id
  IF v_request.status = 'APPROVED' AND v_request.event_id IS NOT NULL THEN
    RETURN v_request.event_id;
  END IF;

  -- Only pending or counter_proposed can be finalized
  IF v_request.status NOT IN ('PENDING', 'COUNTER_PROPOSED') THEN
    RAISE EXCEPTION 'Request cannot be finalized in current status: %', v_request.status;
  END IF;

  -- Determine the final slot times
  IF v_request.status = 'COUNTER_PROPOSED' AND v_request.counter_proposal_start_at IS NOT NULL THEN
    v_start := v_request.counter_proposal_start_at;
    v_end := v_request.counter_proposal_end_at;
  ELSE
    v_start := v_request.requested_start_at;
    v_end := v_request.requested_end_at;
  END IF;

  -- Check for conflicts
  SELECT COUNT(*) INTO v_conflicts
  FROM events e
  JOIN coach_clients cc ON cc.id = e.coach_client_id
  WHERE cc.coach_id = v_coach_id
    AND e.session_status IS DISTINCT FROM 'canceled'
    AND tstzrange(e.start_at, e.end_at, '[)') && tstzrange(v_start, v_end, '[)');
  
  IF v_conflicts > 0 THEN 
    RAISE EXCEPTION 'Slot non disponibile: conflitto con altro appuntamento'; 
  END IF;

  -- Determine economic_type based on client choice
  IF v_request.economic_type = 'package' AND v_request.selected_package_id IS NOT NULL THEN
    -- Client chose a specific package, verify it's still valid
    SELECT * INTO v_pkg FROM package WHERE package_id = v_request.selected_package_id FOR UPDATE;
    
    IF FOUND 
       AND v_pkg.usage_status = 'active'
       AND (v_pkg.total_sessions - v_pkg.consumed_sessions - v_pkg.on_hold_sessions) >= 1
       AND (v_pkg.expires_at IS NULL OR v_pkg.expires_at >= v_end) THEN
      -- Chosen package is still valid
      v_package_id := v_request.selected_package_id;
      v_final_economic_type := 'package';
    ELSE
      -- Chosen package no longer valid, try FEFO fallback
      SELECT p.package_id INTO v_package_id
      FROM package p
      WHERE p.coach_client_id = v_coach_client_id
        AND p.usage_status = 'active'
        AND (p.total_sessions - p.consumed_sessions - p.on_hold_sessions) >= 1
        AND (p.expires_at IS NULL OR p.expires_at >= v_end)
      ORDER BY p.expires_at ASC NULLS LAST, p.created_at ASC
      LIMIT 1
      FOR UPDATE;
      
      IF v_package_id IS NOT NULL THEN
        v_final_economic_type := 'package';
      ELSE
        v_final_economic_type := 'single_paid';
        v_package_id := NULL;
      END IF;
    END IF;
  ELSIF v_request.economic_type = 'single_paid' THEN
    -- Client explicitly chose single_paid
    v_final_economic_type := 'single_paid';
    v_package_id := NULL;
  ELSE
    -- Legacy: no economic choice saved, apply FEFO/single_paid
    SELECT p.package_id INTO v_package_id
    FROM package p
    WHERE p.coach_client_id = v_coach_client_id
      AND p.usage_status = 'active'
      AND (p.total_sessions - p.consumed_sessions - p.on_hold_sessions) >= 1
      AND (p.expires_at IS NULL OR p.expires_at >= v_end)
    ORDER BY p.expires_at ASC NULLS LAST, p.created_at ASC
    LIMIT 1
    FOR UPDATE;
    
    IF v_package_id IS NOT NULL THEN
      v_final_economic_type := 'package';
    ELSE
      v_final_economic_type := 'single_paid';
    END IF;
  END IF;

  -- Get default price for single_paid
  SELECT COALESCE(sessions_1_price, 5000) INTO v_default_price 
  FROM package_settings WHERE coach_id = v_coach_id;

  -- Create the event
  INSERT INTO events (
    coach_client_id,
    title,
    start_at,
    end_at,
    economic_type,
    package_id,
    client_request_id,
    source
  ) VALUES (
    v_coach_client_id,
    'Appuntamento con ' || v_client_name,
    v_start,
    v_end,
    v_final_economic_type,
    v_package_id,
    p_request_id,
    'client'
  ) RETURNING id INTO v_event_id;

  -- If using package, create ledger entry with idempotency
  IF v_final_economic_type = 'package' AND v_package_id IS NOT NULL THEN
    -- Insert ledger entry (idempotent via unique constraint on calendar_event_id + type + reason)
    INSERT INTO package_ledger (
      package_id,
      calendar_event_id,
      type,
      reason,
      delta_hold,
      delta_consumed,
      created_by,
      note
    ) VALUES (
      v_package_id,
      v_event_id,
      'HOLD',
      'HOLD_CREATE',
      1,
      0,
      v_coach_id,
      'Appuntamento prenotato da client'
    )
    ON CONFLICT DO NOTHING;
    
    -- Only update counters if ledger entry was actually inserted
    IF FOUND THEN
      UPDATE package
      SET on_hold_sessions = on_hold_sessions + 1,
          updated_at = now()
      WHERE package_id = v_package_id;
    END IF;
  END IF;

  -- If single_paid, create order_payment draft
  IF v_final_economic_type = 'single_paid' THEN
    INSERT INTO order_payments (
      coach_client_id,
      event_id,
      kind,
      status,
      amount_cents,
      currency_code,
      created_by
    ) VALUES (
      v_coach_client_id,
      v_event_id,
      'single_lesson',
      'draft',
      COALESCE(v_default_price, 5000),
      'EUR',
      v_coach_id
    );
  END IF;

  -- Update the booking request
  UPDATE booking_requests SET 
    status = 'APPROVED',
    approved_at = now(),
    finalized_start_at = v_start,
    finalized_end_at = v_end,
    event_id = v_event_id,
    updated_at = now()
  WHERE id = p_request_id;

  -- Create notification for coach
  INSERT INTO coach_notifications (
    coach_id,
    type,
    title,
    message,
    related_type,
    related_id
  ) VALUES (
    v_coach_id,
    'booking_approved',
    'Appuntamento confermato',
    'Appuntamento con ' || v_client_name || ' confermato',
    'event',
    v_event_id
  );

  RETURN v_event_id;
END;
$$;