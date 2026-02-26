
-- Fix finalize_booking_request: correct 'single_session' -> 'single_lesson' and 'pending' -> 'draft'
CREATE OR REPLACE FUNCTION public.finalize_booking_request(p_request_id uuid)
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
  v_rows_affected int;
  v_has_existing_hold boolean;
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

  -- Check if there's already a hold from the booking request trigger
  v_has_existing_hold := EXISTS (
    SELECT 1 FROM package_ledger 
    WHERE booking_request_id = p_request_id 
    AND type = 'HOLD_CREATE'
  );

  -- Determine economic_type based on client choice
  IF v_request.economic_type = 'package' AND v_request.selected_package_id IS NOT NULL THEN
    -- Client chose a specific package, verify it's still valid
    SELECT * INTO v_pkg FROM package WHERE package_id = v_request.selected_package_id FOR UPDATE;
    
    IF FOUND AND v_pkg.usage_status = 'active' 
       AND (v_pkg.expires_at IS NULL OR v_pkg.expires_at >= v_end) THEN
      -- If we have existing hold, package is already validated and credit reserved
      IF v_has_existing_hold THEN
        v_package_id := v_request.selected_package_id;
        v_final_economic_type := 'package';
      ELSE
        -- Legacy: no hold exists, check if credit available
        IF (v_pkg.total_sessions - v_pkg.consumed_sessions - v_pkg.on_hold_sessions) >= 1 THEN
          v_package_id := v_request.selected_package_id;
          v_final_economic_type := 'package';
        ELSE
          -- No credit available, fallback
          v_final_economic_type := 'single_paid';
          v_package_id := NULL;
        END IF;
      END IF;
    ELSE
      -- Package no longer valid, try FEFO fallback (only if no existing hold)
      IF NOT v_has_existing_hold THEN
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
      ELSE
        -- Has hold but package expired/invalid - shouldn't happen but fallback
        v_final_economic_type := 'single_paid';
        v_package_id := NULL;
      END IF;
    END IF;
  ELSIF v_request.economic_type = 'single_paid' THEN
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

  -- FIX: Get default price from products table instead of package_settings
  SELECT COALESCE(
    (SELECT price_cents FROM products 
     WHERE coach_id = v_coach_id 
       AND type = 'single_session' 
       AND is_active = true 
     ORDER BY sort_order LIMIT 1),
    5000
  ) INTO v_default_price;

  -- Create the event with fixed title "Appuntamento"
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
    'Appuntamento',
    v_start,
    v_end,
    v_final_economic_type,
    v_package_id,
    p_request_id,
    'client'
  ) RETURNING id INTO v_event_id;

  -- Handle package ledger
  IF v_final_economic_type = 'package' AND v_package_id IS NOT NULL THEN
    -- Try to link existing hold from booking request to the event
    UPDATE package_ledger 
    SET calendar_event_id = v_event_id
    WHERE booking_request_id = p_request_id 
      AND type = 'HOLD_CREATE'
      AND calendar_event_id IS NULL;
    
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    
    -- If no existing hold was linked, create a new one (legacy requests)
    IF v_rows_affected = 0 THEN
      INSERT INTO package_ledger (
        package_id,
        calendar_event_id,
        booking_request_id,
        type,
        reason,
        delta_hold,
        delta_consumed,
        created_by,
        note
      ) VALUES (
        v_package_id,
        v_event_id,
        p_request_id,
        'HOLD_CREATE',
        'CONFIRM',
        1,
        0,
        v_coach_id,
        'Hold creato da approvazione booking request'
      );
      
      -- Update package counters
      UPDATE package SET on_hold_sessions = on_hold_sessions + 1 WHERE package_id = v_package_id;
    END IF;
  ELSIF v_final_economic_type = 'single_paid' THEN
    -- Create single_paid order — FIX: use 'single_lesson' and 'draft'
    INSERT INTO orders (
      coach_client_id,
      event_id,
      kind,
      amount_cents,
      currency_code,
      status,
      created_by
    ) VALUES (
      v_coach_client_id,
      v_event_id,
      'single_lesson',
      v_default_price,
      COALESCE(
        (SELECT currency_code FROM coach_settings WHERE coach_id = v_coach_id),
        'EUR'
      ),
      'draft',
      v_coach_id
    );
  END IF;

  -- Update the booking request
  UPDATE booking_requests 
  SET status = 'APPROVED',
      event_id = v_event_id,
      approved_at = now(),
      finalized_start_at = v_start,
      finalized_end_at = v_end,
      updated_at = now()
  WHERE id = p_request_id;

  RETURN v_event_id;
END;
$$;

-- Align chk_order_kind_refs: remove unreachable legacy values
ALTER TABLE orders DROP CONSTRAINT chk_order_kind_refs;
ALTER TABLE orders ADD CONSTRAINT chk_order_kind_refs CHECK (
  (kind = 'single_lesson' AND event_id IS NOT NULL AND package_id IS NULL)
  OR (kind = 'package_purchase' AND package_id IS NOT NULL AND event_id IS NULL)
);
