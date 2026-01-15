-- ============================================================
-- FASE 1: Aggiornamento Schema orders
-- ============================================================

-- 1.1 Aggiungi colonne per pagamenti esterni e rimborsi
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS external_payment_id TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- 1.2 Crea indice unique per external_payment_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_external_payment_id 
ON orders(external_payment_id) 
WHERE external_payment_id IS NOT NULL;

-- 1.3 Aggiorna CHECK constraint per includere refund_pending
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_order_status;
ALTER TABLE orders ADD CONSTRAINT chk_order_status 
CHECK (status IN ('draft', 'due', 'paid', 'canceled', 'refunded', 'refund_pending'));

-- ============================================================
-- FASE 2: RPC cancel_event_with_ledger aggiornata
-- ============================================================

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
  v_event RECORD;
  v_coach_id uuid;
  v_lock_window_hours int;
  v_event_start timestamptz;
  v_cutoff timestamptz;
  v_is_late boolean;
  v_ledger_action text := 'none';
  v_order_old_status text;
  v_order_new_status text;
  v_order_external_id text;
  v_requires_refund boolean := false;
  v_refund_completed boolean := false;
BEGIN
  -- 1. Fetch event with all economic details
  SELECT 
    e.id,
    e.coach_client_id,
    e.start_at,
    e.economic_type,
    e.package_id,
    e.order_payment_id,
    e.session_status,
    cc.coach_id
  INTO v_event
  FROM events e
  JOIN coach_clients cc ON cc.id = e.coach_client_id
  WHERE e.id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', p_event_id;
  END IF;

  -- 2. Check if already canceled
  IF v_event.session_status = 'canceled' THEN
    RAISE EXCEPTION 'Event already canceled';
  END IF;

  v_coach_id := v_event.coach_id;
  v_event_start := v_event.start_at;

  -- 3. Get lock window from coach_settings
  SELECT COALESCE(lock_window_hours, 24)
  INTO v_lock_window_hours
  FROM coach_settings
  WHERE coach_id = v_coach_id;

  IF v_lock_window_hours IS NULL THEN
    v_lock_window_hours := 24;
  END IF;

  -- 4. Calculate cutoff and determine if late
  v_cutoff := v_event_start - (v_lock_window_hours || ' hours')::interval;
  v_is_late := p_now >= v_cutoff;

  -- 5. Handle based on economic_type
  
  -- ============================================================
  -- CASE A: Package-linked event
  -- ============================================================
  IF v_event.economic_type = 'from_package' AND v_event.package_id IS NOT NULL THEN
    IF p_actor = 'coach' OR NOT v_is_late THEN
      -- Coach cancels OR early cancel: release hold
      INSERT INTO package_ledger (
        package_id, calendar_event_id, type, reason, delta_hold, delta_consumed, note
      ) VALUES (
        v_event.package_id, p_event_id, 'HOLD_RELEASE', 'CANCEL_GT_24H', -1, 0,
        'Cancellazione anticipata/coach'
      );
      
      UPDATE package 
      SET on_hold_sessions = on_hold_sessions - 1
      WHERE package_id = v_event.package_id;
      
      v_ledger_action := 'hold_released';
    ELSE
      -- Late cancel by client: consume credit as penalty
      INSERT INTO package_ledger (
        package_id, calendar_event_id, type, reason, delta_hold, delta_consumed, note
      ) VALUES (
        v_event.package_id, p_event_id, 'CONSUME', 'CANCEL_LT_24H', -1, 1,
        'Cancellazione tardiva - credito consumato'
      );
      
      UPDATE package 
      SET on_hold_sessions = on_hold_sessions - 1,
          consumed_sessions = consumed_sessions + 1
      WHERE package_id = v_event.package_id;
      
      v_ledger_action := 'credit_consumed';
    END IF;

  -- ============================================================
  -- CASE B: Single paid lesson (linked order)
  -- ============================================================
  ELSIF v_event.economic_type = 'single_paid' AND v_event.order_payment_id IS NOT NULL THEN
    -- Fetch current order status
    SELECT status, external_payment_id 
    INTO v_order_old_status, v_order_external_id
    FROM orders 
    WHERE id = v_event.order_payment_id;

    -- Block if already refunded or refund pending
    IF v_order_old_status IN ('refunded', 'refund_pending') THEN
      RAISE EXCEPTION 'Cannot cancel: order already % (order_id: %)', v_order_old_status, v_event.order_payment_id;
    END IF;

    IF p_actor = 'coach' OR NOT v_is_late THEN
      -- ========================================
      -- EARLY CANCEL (or Coach cancel)
      -- ========================================
      IF v_order_old_status IN ('draft', 'due') THEN
        -- Not yet paid: simply cancel
        UPDATE orders 
        SET status = 'canceled', canceled_at = p_now
        WHERE id = v_event.order_payment_id;
        v_order_new_status := 'canceled';
        v_ledger_action := 'order_canceled';
        
      ELSIF v_order_old_status = 'paid' THEN
        -- Already paid: need refund
        IF v_order_external_id IS NOT NULL THEN
          -- Has external payment: mark for manual/API refund
          UPDATE orders 
          SET status = 'refund_pending'
          WHERE id = v_event.order_payment_id;
          v_order_new_status := 'refund_pending';
          v_requires_refund := true;
          v_ledger_action := 'refund_pending';
        ELSE
          -- Cash/manual payment: mark as refunded directly
          UPDATE orders 
          SET status = 'refunded', refunded_at = p_now
          WHERE id = v_event.order_payment_id;
          v_order_new_status := 'refunded';
          v_refund_completed := true;
          v_ledger_action := 'refunded';
        END IF;
      END IF;
      
    ELSE
      -- ========================================
      -- LATE CANCEL (by Client)
      -- ========================================
      IF v_order_old_status = 'draft' THEN
        -- Not paid yet: client must pay penalty
        UPDATE orders 
        SET status = 'due', due_at = p_now
        WHERE id = v_event.order_payment_id;
        v_order_new_status := 'due';
        v_ledger_action := 'penalty_due';
        
      ELSIF v_order_old_status IN ('due', 'paid') THEN
        -- Already due or paid: coach keeps the money
        v_order_new_status := v_order_old_status;
        v_ledger_action := 'coach_retains';
      END IF;
    END IF;

  -- ============================================================
  -- CASE C: Free event or other types
  -- ============================================================
  ELSE
    v_ledger_action := 'none';
  END IF;

  -- 6. Mark event as canceled (soft delete)
  UPDATE events 
  SET session_status = 'canceled',
      updated_at = p_now
  WHERE id = p_event_id;

  -- 7. Return comprehensive result
  RETURN jsonb_build_object(
    'event_id', p_event_id,
    'canceled', true,
    'economic_type', v_event.economic_type,
    'is_late', v_is_late,
    'actor', p_actor,
    'lock_window_hours', v_lock_window_hours,
    'ledger_action', v_ledger_action,
    'order_id', v_event.order_payment_id,
    'order_previous_status', v_order_old_status,
    'order_new_status', v_order_new_status,
    'requires_refund', v_requires_refund,
    'refund_completed', v_refund_completed
  );
END;
$$;

-- ============================================================
-- FASE 3: Helper function per completare rimborsi
-- ============================================================

CREATE OR REPLACE FUNCTION public.complete_order_refund(
  p_order_id uuid,
  p_external_refund_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
BEGIN
  -- Fetch and validate current status
  SELECT status INTO v_old_status
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  IF v_old_status != 'refund_pending' THEN
    RAISE EXCEPTION 'Order is not in refund_pending status (current: %)', v_old_status;
  END IF;

  -- Mark as refunded
  UPDATE orders 
  SET status = 'refunded', 
      refunded_at = now(),
      note = CASE 
        WHEN note IS NULL THEN 'Refund ID: ' || COALESCE(p_external_refund_id, 'manual')
        ELSE note || ' | Refund ID: ' || COALESCE(p_external_refund_id, 'manual')
      END
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'status', 'refunded',
    'external_refund_id', p_external_refund_id,
    'refunded_at', now()
  );
END;
$$;