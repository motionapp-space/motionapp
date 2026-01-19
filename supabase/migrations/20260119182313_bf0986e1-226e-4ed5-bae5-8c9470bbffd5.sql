
-- Create internal version that accepts user_id for service role calls
CREATE OR REPLACE FUNCTION public.check_client_owns_coach_client_internal(p_coach_client_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE cc.id = p_coach_client_id AND c.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized: client does not own this relationship';
  END IF;
  RETURN true;
END;
$$;

-- Update cancel_event_with_ledger to accept optional client_user_id for service role calls
CREATE OR REPLACE FUNCTION public.cancel_event_with_ledger(
  p_event_id uuid,
  p_actor text,
  p_now timestamptz DEFAULT now(),
  p_client_user_id uuid DEFAULT NULL
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
    -- Use internal check if p_client_user_id is provided (service role call)
    IF p_client_user_id IS NOT NULL THEN
      PERFORM check_client_owns_coach_client_internal(v_event.coach_client_id, p_client_user_id);
    ELSE
      PERFORM check_client_owns_coach_client(v_event.coach_client_id);
    END IF;
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
  SELECT COALESCE(lock_window_hours, 24) INTO v_lock_window_hours 
  FROM package_settings WHERE coach_id = v_coach_id;
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
