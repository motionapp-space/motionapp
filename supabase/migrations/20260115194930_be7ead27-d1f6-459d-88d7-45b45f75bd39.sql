
-- =====================================================
-- Migration: Fix RPC Legacy References
-- Changes:
--   1. cancel_event_with_ledger: package_settings -> coach_settings, order_payments -> orders
--   2. create_event_with_economics_internal: package_settings -> products, order_payments -> orders
--   3. finalize_booking_request: package_settings -> products, order_payments -> orders
--   4. finalize_past_events: order_payments -> orders
--   5. Create trigger to block technical packages
-- =====================================================

-- 1. Fix cancel_event_with_ledger
CREATE OR REPLACE FUNCTION public.cancel_event_with_ledger(
  p_actor text,
  p_event_id uuid,
  p_now timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_pkg package%ROWTYPE;
  v_coach_id uuid;
  v_lock_window_hours int;
  v_hours_until numeric;
  v_is_late boolean;
  v_ledger_action text := 'none';
  v_order_status text;
  v_inserted boolean := false;
  v_has_hold boolean;
  v_has_release boolean;
  v_has_consume boolean;
BEGIN
  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Event not found'); END IF;
  
  IF p_actor = 'coach' THEN
    PERFORM check_coach_owns_coach_client(v_event.coach_client_id);
  ELSIF p_actor = 'client' THEN
    PERFORM check_client_owns_coach_client(v_event.coach_client_id);
  ELSE
    RAISE EXCEPTION 'Invalid actor: must be coach or client';
  END IF;
  
  IF v_event.session_status = 'canceled' THEN
    RETURN jsonb_build_object('event_id', p_event_id, 'already_canceled', true);
  END IF;

  IF v_event.session_status = 'done' THEN
    RAISE EXCEPTION 'Cannot cancel completed event. Use manual correction if needed.';
  END IF;

  SELECT coach_id INTO v_coach_id FROM coach_clients WHERE id = v_event.coach_client_id;
  
  -- FIX: Read from coach_settings instead of package_settings
  SELECT COALESCE(lock_window_hours, 24) INTO v_lock_window_hours 
  FROM coach_settings WHERE coach_id = v_coach_id;
  IF v_lock_window_hours IS NULL THEN v_lock_window_hours := 24; END IF;
  
  v_hours_until := EXTRACT(EPOCH FROM (v_event.start_at - p_now)) / 3600;
  v_is_late := v_hours_until < v_lock_window_hours;
  
  IF p_actor = 'coach' THEN v_is_late := false; END IF;

  IF v_event.economic_type = 'package' AND v_event.package_id IS NOT NULL THEN
    SELECT * INTO v_pkg FROM package WHERE package_id = v_event.package_id FOR UPDATE;
    
    SELECT 
      EXISTS(SELECT 1 FROM package_ledger WHERE calendar_event_id = p_event_id AND type = 'HOLD_CREATE'),
      EXISTS(SELECT 1 FROM package_ledger WHERE calendar_event_id = p_event_id AND type = 'HOLD_RELEASE'),
      EXISTS(SELECT 1 FROM package_ledger WHERE calendar_event_id = p_event_id AND type = 'CONSUME')
    INTO v_has_hold, v_has_release, v_has_consume;
    
    IF v_has_hold AND NOT v_has_release AND NOT v_has_consume THEN
      IF v_is_late THEN
        INSERT INTO package_ledger (package_id, calendar_event_id, type, reason, delta_hold, delta_consumed)
        VALUES (v_event.package_id, p_event_id, 'CONSUME', 'CANCEL_LT_24H', -1, 1)
        ON CONFLICT DO NOTHING
        RETURNING true INTO v_inserted;
        
        IF v_inserted IS TRUE THEN
          UPDATE package SET 
            on_hold_sessions = GREATEST(0, on_hold_sessions - 1),
            consumed_sessions = consumed_sessions + 1
          WHERE package_id = v_event.package_id;
        END IF;
        v_ledger_action := 'consume';
      ELSE
        INSERT INTO package_ledger (package_id, calendar_event_id, type, reason, delta_hold, delta_consumed)
        VALUES (v_event.package_id, p_event_id, 'HOLD_RELEASE', 'CANCEL_GT_24H', -1, 0)
        ON CONFLICT DO NOTHING
        RETURNING true INTO v_inserted;
        
        IF v_inserted IS TRUE THEN
          UPDATE package SET on_hold_sessions = GREATEST(0, on_hold_sessions - 1)
          WHERE package_id = v_event.package_id;
        END IF;
        v_ledger_action := 'release';
      END IF;
    END IF;
  
  ELSIF v_event.economic_type = 'single_paid' AND v_event.order_payment_id IS NOT NULL THEN
    -- FIX: Update orders table instead of order_payments
    IF v_is_late THEN
      UPDATE orders SET status = 'due', due_at = p_now 
      WHERE id = v_event.order_payment_id AND status = 'draft';
      v_order_status := 'due';
    ELSE
      UPDATE orders SET status = 'canceled', canceled_at = p_now 
      WHERE id = v_event.order_payment_id AND status = 'draft';
      v_order_status := 'canceled';
    END IF;
  END IF;

  UPDATE events SET session_status = 'canceled' WHERE id = p_event_id;

  RETURN jsonb_build_object(
    'event_id', p_event_id,
    'canceled', true,
    'economic_type', v_event.economic_type,
    'is_late', v_is_late,
    'ledger_action', v_ledger_action,
    'order_status', v_order_status
  );
END;
$$;

-- 2. Fix create_event_with_economics_internal
CREATE OR REPLACE FUNCTION public.create_event_with_economics_internal(
  p_coach_client_id uuid,
  p_title text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_economic_type text,
  p_location text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_series_id uuid DEFAULT NULL,
  p_series_request_id uuid DEFAULT NULL,
  p_package_id uuid DEFAULT NULL,
  p_amount_cents int DEFAULT NULL,
  p_client_request_id uuid DEFAULT NULL,
  p_source text DEFAULT 'coach'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_order_id uuid;
  v_available int;
  v_pkg package%ROWTYPE;
  v_inserted boolean := false;
  v_coach_id uuid;
  v_default_price int;
BEGIN
  -- Idempotency: check client_request_id
  IF p_client_request_id IS NOT NULL THEN
    SELECT id INTO v_event_id FROM events WHERE client_request_id = p_client_request_id;
    IF FOUND THEN RETURN v_event_id; END IF;
  END IF;

  -- Idempotency serie: check series_request_id + start_at
  IF p_series_request_id IS NOT NULL THEN
    SELECT id INTO v_event_id FROM events 
    WHERE series_request_id = p_series_request_id AND start_at = p_start_at;
    IF FOUND THEN RETURN v_event_id; END IF;
  END IF;

  IF p_economic_type NOT IN ('none', 'free', 'package', 'single_paid') THEN
    RAISE EXCEPTION 'Invalid economic_type: %', p_economic_type;
  END IF;

  -- Package validation
  IF p_economic_type = 'package' THEN
    IF p_package_id IS NULL THEN
      RAISE EXCEPTION 'package_id required for economic_type=package';
    END IF;
    
    SELECT * INTO v_pkg FROM package WHERE package_id = p_package_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Package not found'; END IF;
    IF v_pkg.coach_client_id != p_coach_client_id THEN 
      RAISE EXCEPTION 'Package does not belong to this client'; 
    END IF;
    IF v_pkg.usage_status != 'active' THEN RAISE EXCEPTION 'Package not active'; END IF;
    IF v_pkg.expires_at IS NOT NULL AND v_pkg.expires_at < p_end_at THEN
      RAISE EXCEPTION 'Package expires before event ends';
    END IF;
    
    v_available := v_pkg.total_sessions - v_pkg.consumed_sessions - v_pkg.on_hold_sessions;
    IF v_available < 1 THEN RAISE EXCEPTION 'No available credits'; END IF;
  END IF;

  -- FIX: Get default price from products table instead of package_settings
  IF p_economic_type = 'single_paid' THEN
    SELECT coach_id INTO v_coach_id FROM coach_clients WHERE id = p_coach_client_id;
    SELECT COALESCE(
      (SELECT price_cents FROM products 
       WHERE coach_id = v_coach_id 
         AND type = 'single_session' 
         AND is_active = true 
       ORDER BY sort_order LIMIT 1),
      5000
    ) INTO v_default_price;
  END IF;

  -- Create event
  INSERT INTO events (
    coach_client_id, title, start_at, end_at, location, notes,
    series_id, series_request_id, economic_type, package_id, 
    session_status, source, client_request_id
  ) VALUES (
    p_coach_client_id, p_title, p_start_at, p_end_at, p_location, p_notes,
    p_series_id, p_series_request_id, p_economic_type, 
    CASE WHEN p_economic_type = 'package' THEN p_package_id ELSE NULL END,
    'scheduled', p_source, p_client_request_id
  ) RETURNING id INTO v_event_id;

  -- Economic actions
  IF p_economic_type = 'package' THEN
    INSERT INTO package_ledger (package_id, calendar_event_id, type, reason, delta_hold, delta_consumed)
    VALUES (p_package_id, v_event_id, 'HOLD_CREATE', 'CONFIRM', 1, 0)
    ON CONFLICT DO NOTHING
    RETURNING true INTO v_inserted;
    
    IF v_inserted IS TRUE THEN
      UPDATE package SET on_hold_sessions = on_hold_sessions + 1 
      WHERE package_id = p_package_id;
    END IF;
  
  ELSIF p_economic_type = 'single_paid' THEN
    -- FIX: Insert into orders table instead of order_payments
    INSERT INTO orders (
      coach_client_id, event_id, kind, status, amount_cents, currency_code
    ) VALUES (
      p_coach_client_id, v_event_id, 'single_lesson', 'draft', 
      COALESCE(p_amount_cents, v_default_price), 'EUR'
    )
    RETURNING id INTO v_order_id;
    
    UPDATE events SET order_payment_id = v_order_id WHERE id = v_event_id;
  END IF;

  RETURN v_event_id;
END;
$$;

-- 3. Fix finalize_booking_request
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
        'BOOKING_CONFIRMED',
        1,
        0,
        v_coach_id,
        'Hold creato alla conferma (richiesta legacy senza hold iniziale)'
      )
      ON CONFLICT DO NOTHING;
      
      GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
      
      IF v_rows_affected > 0 THEN
        UPDATE package
        SET on_hold_sessions = on_hold_sessions + 1, updated_at = now()
        WHERE package_id = v_package_id;
      END IF;
    END IF;
  END IF;

  -- FIX: Insert into orders table instead of order_payments
  IF v_final_economic_type = 'single_paid' THEN
    INSERT INTO orders (
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

-- 4. Fix finalize_past_events
CREATE OR REPLACE FUNCTION public.finalize_past_events(p_now timestamptz DEFAULT now())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_completed int := 0;
  v_orders_due int := 0;
  v_skipped int := 0;
  v_flagged int := 0;
  v_inserted boolean := false;
  v_has_hold boolean;
  v_has_consume boolean;
  v_has_release boolean;
  v_can_close boolean;
  v_warning text;
BEGIN
  FOR v_event IN 
    SELECT * FROM events 
    WHERE start_at < p_now 
      AND session_status NOT IN ('canceled', 'done')
    FOR UPDATE
  LOOP
    v_can_close := false;
    v_warning := NULL;

    IF v_event.economic_type = 'package' AND v_event.package_id IS NOT NULL THEN
      SELECT 
        EXISTS(SELECT 1 FROM package_ledger WHERE calendar_event_id = v_event.id AND type = 'HOLD_CREATE'),
        EXISTS(SELECT 1 FROM package_ledger WHERE calendar_event_id = v_event.id AND type = 'CONSUME'),
        EXISTS(SELECT 1 FROM package_ledger WHERE calendar_event_id = v_event.id AND type = 'HOLD_RELEASE')
      INTO v_has_hold, v_has_consume, v_has_release;
      
      IF v_has_hold AND NOT v_has_consume AND NOT v_has_release THEN
        INSERT INTO package_ledger (package_id, calendar_event_id, type, reason, delta_hold, delta_consumed)
        VALUES (v_event.package_id, v_event.id, 'CONSUME', 'COMPLETE', -1, 1)
        ON CONFLICT DO NOTHING
        RETURNING true INTO v_inserted;
        
        IF v_inserted IS TRUE THEN
          UPDATE package SET 
            on_hold_sessions = GREATEST(0, on_hold_sessions - 1),
            consumed_sessions = consumed_sessions + 1
          WHERE package_id = v_event.package_id;
          v_completed := v_completed + 1;
          v_can_close := true;
        ELSE
          v_skipped := v_skipped + 1;
        END IF;
      ELSIF v_has_consume OR v_has_release THEN
        v_can_close := true;
        v_skipped := v_skipped + 1;
      ELSE
        v_flagged := v_flagged + 1;
        v_warning := 'MISSING_HOLD_CREATE: evento package senza entry HOLD nel ledger';
        v_can_close := false;
      END IF;
    
    -- FIX: Update orders table instead of order_payments
    ELSIF v_event.economic_type = 'single_paid' AND v_event.order_payment_id IS NOT NULL THEN
      UPDATE orders SET status = 'due', due_at = p_now 
      WHERE id = v_event.order_payment_id AND status = 'draft';
      
      IF FOUND THEN v_orders_due := v_orders_due + 1; END IF;
      v_can_close := true;
    
    ELSIF v_event.economic_type = 'single_paid' AND v_event.order_payment_id IS NULL THEN
      v_flagged := v_flagged + 1;
      v_warning := 'MISSING_ORDER: evento single_paid senza order';
      v_can_close := false;
    
    ELSIF v_event.economic_type IN ('none', 'free') THEN
      v_can_close := true;
      v_skipped := v_skipped + 1;
    
    ELSE
      v_skipped := v_skipped + 1;
    END IF;

    IF v_warning IS NOT NULL THEN
      UPDATE events SET economic_warning = v_warning WHERE id = v_event.id;
    ELSIF v_can_close THEN
      UPDATE events SET session_status = 'done', economic_warning = NULL WHERE id = v_event.id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'completed_with_package', v_completed,
    'orders_now_due', v_orders_due,
    'skipped', v_skipped,
    'flagged_inconsistent', v_flagged,
    'processed_at', p_now
  );
END;
$$;

-- 5. Create trigger to block technical packages
CREATE OR REPLACE FUNCTION public.prevent_new_technical_packages()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_single_technical = true THEN
    RAISE EXCEPTION 'Legacy technical packages are deprecated. Use direct Orders flow.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS block_technical_packages ON package;
CREATE TRIGGER block_technical_packages
  BEFORE INSERT ON package
  FOR EACH ROW
  EXECUTE FUNCTION prevent_new_technical_packages();
