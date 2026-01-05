-- =============================================================================
-- FASE 1: Nuove colonne su events
-- =============================================================================

-- Colonne principali
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS series_id uuid NULL,
  ADD COLUMN IF NOT EXISTS economic_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS package_id uuid NULL,
  ADD COLUMN IF NOT EXISTS order_payment_id uuid NULL,
  ADD COLUMN IF NOT EXISTS client_request_id uuid NULL,
  ADD COLUMN IF NOT EXISTS series_request_id uuid NULL,
  ADD COLUMN IF NOT EXISTS economic_warning text NULL;

-- CHECK economic_type valido
ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_events_economic_type;
ALTER TABLE events
  ADD CONSTRAINT chk_events_economic_type 
  CHECK (economic_type IN ('none', 'package', 'single_paid', 'free'));

-- Unique per idempotenza evento singolo
DROP INDEX IF EXISTS uniq_events_client_request;
CREATE UNIQUE INDEX uniq_events_client_request 
  ON events (client_request_id) 
  WHERE client_request_id IS NOT NULL;

-- Unique per idempotenza serie
DROP INDEX IF EXISTS uniq_events_series_request;
CREATE UNIQUE INDEX uniq_events_series_request 
  ON events (series_request_id, start_at) 
  WHERE series_request_id IS NOT NULL;

-- Indice per serie
DROP INDEX IF EXISTS idx_events_series;
CREATE INDEX idx_events_series ON events (coach_client_id, series_id, start_at)
  WHERE series_id IS NOT NULL;

-- Indice per warning
DROP INDEX IF EXISTS idx_events_economic_warning;
CREATE INDEX idx_events_economic_warning ON events (economic_warning)
  WHERE economic_warning IS NOT NULL;

-- FK a package
ALTER TABLE events DROP CONSTRAINT IF EXISTS fk_events_package;
ALTER TABLE events
  ADD CONSTRAINT fk_events_package 
  FOREIGN KEY (package_id) REFERENCES package(package_id) ON DELETE SET NULL;

-- =============================================================================
-- FASE 2: Trasformazione payment → order_payments
-- =============================================================================

-- Rename tabella (solo se esiste come payment)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment' AND table_schema = 'public') THEN
    ALTER TABLE payment RENAME TO order_payments;
    ALTER TABLE order_payments RENAME COLUMN payment_id TO id;
  END IF;
END $$;

-- Aggiungi colonne a order_payments
DO $$
BEGIN
  -- coach_client_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'coach_client_id') THEN
    ALTER TABLE order_payments ADD COLUMN coach_client_id uuid NULL;
  END IF;
  
  -- event_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'event_id') THEN
    ALTER TABLE order_payments ADD COLUMN event_id uuid NULL;
  END IF;
  
  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'status') THEN
    ALTER TABLE order_payments ADD COLUMN status text NOT NULL DEFAULT 'draft';
  END IF;
  
  -- due_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'due_at') THEN
    ALTER TABLE order_payments ADD COLUMN due_at timestamptz NULL;
  END IF;
  
  -- paid_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'paid_at') THEN
    ALTER TABLE order_payments ADD COLUMN paid_at timestamptz NULL;
  END IF;
  
  -- canceled_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_payments' AND column_name = 'canceled_at') THEN
    ALTER TABLE order_payments ADD COLUMN canceled_at timestamptz NULL;
  END IF;
END $$;

-- Rendi package_id nullable
ALTER TABLE order_payments ALTER COLUMN package_id DROP NOT NULL;

-- Constraints
ALTER TABLE order_payments DROP CONSTRAINT IF EXISTS chk_order_kind;
ALTER TABLE order_payments DROP CONSTRAINT IF EXISTS chk_order_status;

ALTER TABLE order_payments
  ADD CONSTRAINT chk_order_kind CHECK (kind IN ('single_lesson', 'package_purchase')),
  ADD CONSTRAINT chk_order_status CHECK (status IN ('draft', 'due', 'paid', 'canceled', 'refunded'));

-- Indici
DROP INDEX IF EXISTS idx_order_payments_coach_client_status;
CREATE INDEX idx_order_payments_coach_client_status 
  ON order_payments (coach_client_id, status, created_at DESC);

DROP INDEX IF EXISTS uniq_order_single_event;
CREATE UNIQUE INDEX uniq_order_single_event 
  ON order_payments (event_id) WHERE kind = 'single_lesson';

-- FK
ALTER TABLE order_payments DROP CONSTRAINT IF EXISTS fk_order_coach_client;
ALTER TABLE order_payments DROP CONSTRAINT IF EXISTS fk_order_event;

ALTER TABLE order_payments
  ADD CONSTRAINT fk_order_coach_client 
  FOREIGN KEY (coach_client_id) REFERENCES coach_clients(id),
  ADD CONSTRAINT fk_order_event 
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage order_payments" ON order_payments;
CREATE POLICY "Coaches can manage order_payments" ON order_payments
  FOR ALL USING (
    coach_client_id IN (SELECT id FROM coach_clients WHERE coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "Clients can view own due orders" ON order_payments;
CREATE POLICY "Clients can view own due orders" ON order_payments
  FOR SELECT USING (
    coach_client_id IN (
      SELECT cc.id FROM coach_clients cc 
      JOIN clients c ON c.id = cc.client_id 
      WHERE c.user_id = auth.uid()
    )
    AND status = 'due'
  );

-- =============================================================================
-- FASE 3: Helper Functions
-- =============================================================================

CREATE OR REPLACE FUNCTION check_coach_owns_coach_client(p_coach_client_id uuid)
RETURNS boolean AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM coach_clients 
    WHERE id = p_coach_client_id AND coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized: coach does not own this coach_client';
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_client_owns_coach_client(p_coach_client_id uuid)
RETURNS boolean AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE cc.id = p_coach_client_id AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized: client does not own this relationship';
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION select_fefo_package_internal(
  p_coach_client_id uuid,
  p_required_sessions int DEFAULT 1,
  p_latest_end timestamptz DEFAULT NULL
) RETURNS uuid AS $$
  SELECT package_id
  FROM package
  WHERE coach_client_id = p_coach_client_id
    AND usage_status = 'active'
    AND (total_sessions - consumed_sessions - on_hold_sessions) >= p_required_sessions
    AND (expires_at IS NULL OR expires_at >= COALESCE(p_latest_end, now()))
  ORDER BY expires_at ASC NULLS LAST, created_at ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- FASE 4: create_event_with_economics_internal (Senza Auth Check)
-- =============================================================================

CREATE OR REPLACE FUNCTION create_event_with_economics_internal(
  p_coach_client_id uuid,
  p_title text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_economic_type text,
  p_package_id uuid DEFAULT NULL,
  p_series_id uuid DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_amount_cents int DEFAULT NULL,
  p_client_request_id uuid DEFAULT NULL,
  p_series_request_id uuid DEFAULT NULL,
  p_source text DEFAULT 'manual'
) RETURNS uuid AS $$
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

  -- Get default price
  IF p_economic_type = 'single_paid' THEN
    SELECT coach_id INTO v_coach_id FROM coach_clients WHERE id = p_coach_client_id;
    SELECT COALESCE(sessions_1_price, 5000) INTO v_default_price 
    FROM package_settings WHERE coach_id = v_coach_id;
    IF v_default_price IS NULL THEN v_default_price := 5000; END IF;
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
    INSERT INTO order_payments (
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- FASE 5: create_event_with_economics (Con Auth Check)
-- =============================================================================

CREATE OR REPLACE FUNCTION create_event_with_economics(
  p_coach_client_id uuid,
  p_title text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_economic_type text,
  p_package_id uuid DEFAULT NULL,
  p_series_id uuid DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_amount_cents int DEFAULT NULL,
  p_client_request_id uuid DEFAULT NULL
) RETURNS uuid AS $$
BEGIN
  PERFORM check_coach_owns_coach_client(p_coach_client_id);
  
  RETURN create_event_with_economics_internal(
    p_coach_client_id, p_title, p_start_at, p_end_at, p_economic_type,
    p_package_id, p_series_id, p_location, p_notes, p_amount_cents,
    p_client_request_id, NULL, 'manual'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- FASE 6: create_recurring_series_with_economics
-- =============================================================================

CREATE OR REPLACE FUNCTION create_recurring_series_with_economics(
  p_coach_client_id uuid,
  p_events jsonb,
  p_economic_type text,
  p_package_id uuid DEFAULT NULL,
  p_amount_cents int DEFAULT NULL,
  p_series_request_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_series_id uuid := gen_random_uuid();
  v_series_req_id uuid := COALESCE(p_series_request_id, gen_random_uuid());
  v_event_record jsonb;
  v_event_id uuid;
  v_event_ids uuid[] := '{}';
  v_count int;
  v_idx int := 0;
  v_pkg package%ROWTYPE;
  v_available int;
  v_latest_end timestamptz;
  v_deterministic_request_id uuid;
BEGIN
  PERFORM check_coach_owns_coach_client(p_coach_client_id);

  v_count := jsonb_array_length(p_events);
  IF v_count = 0 THEN RAISE EXCEPTION 'No events provided'; END IF;

  SELECT MAX((e->>'end_at')::timestamptz) INTO v_latest_end
  FROM jsonb_array_elements(p_events) e;

  IF p_economic_type = 'package' THEN
    IF p_package_id IS NULL THEN 
      RAISE EXCEPTION 'package_id obbligatorio per serie con pacchetto'; 
    END IF;
    
    SELECT * INTO v_pkg FROM package WHERE package_id = p_package_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pacchetto non trovato'; END IF;
    IF v_pkg.coach_client_id != p_coach_client_id THEN 
      RAISE EXCEPTION 'Pacchetto non appartiene a questo cliente'; 
    END IF;
    IF v_pkg.usage_status != 'active' THEN 
      RAISE EXCEPTION 'Pacchetto non attivo'; 
    END IF;
    
    IF v_pkg.expires_at IS NOT NULL AND v_pkg.expires_at < v_latest_end THEN
      RAISE EXCEPTION 'Il pacchetto scade il % ma l''ultima occorrenza è il %. Scegli un pacchetto con scadenza successiva.', 
        v_pkg.expires_at::date, v_latest_end::date;
    END IF;
    
    v_available := v_pkg.total_sessions - v_pkg.consumed_sessions - v_pkg.on_hold_sessions;
    IF v_available < v_count THEN 
      RAISE EXCEPTION 'Crediti insufficienti: hai % disponibili ma servono % per coprire tutta la serie.', 
        v_available, v_count;
    END IF;
  END IF;

  FOR v_event_record IN SELECT * FROM jsonb_array_elements(p_events)
  LOOP
    v_idx := v_idx + 1;
    v_deterministic_request_id := gen_random_uuid();
    
    v_event_id := create_event_with_economics_internal(
      p_coach_client_id,
      COALESCE(v_event_record->>'title', 'Allenamento'),
      (v_event_record->>'start_at')::timestamptz,
      (v_event_record->>'end_at')::timestamptz,
      p_economic_type,
      p_package_id,
      v_series_id,
      NULL, NULL,
      p_amount_cents,
      v_deterministic_request_id,
      v_series_req_id,
      'manual'
    );
    v_event_ids := array_append(v_event_ids, v_event_id);
  END LOOP;

  RETURN jsonb_build_object(
    'series_id', v_series_id,
    'series_request_id', v_series_req_id,
    'event_ids', to_jsonb(v_event_ids),
    'count', v_count,
    'economic_type', p_economic_type,
    'package_id', p_package_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- FASE 7: cancel_event_with_ledger
-- =============================================================================

CREATE OR REPLACE FUNCTION cancel_event_with_ledger(
  p_event_id uuid,
  p_actor text,
  p_now timestamptz DEFAULT now()
) RETURNS jsonb AS $$
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
      UPDATE order_payments SET status = 'due', due_at = p_now 
      WHERE id = v_event.order_payment_id AND status = 'draft';
      v_order_status := 'due';
    ELSE
      UPDATE order_payments SET status = 'canceled', canceled_at = p_now 
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- FASE 8: cancel_series_with_ledger
-- =============================================================================

CREATE OR REPLACE FUNCTION cancel_series_with_ledger(
  p_series_id uuid,
  p_actor text,
  p_now timestamptz DEFAULT now()
) RETURNS jsonb AS $$
DECLARE
  v_event_id uuid;
  v_event_ids uuid[];
  v_results jsonb[] := '{}';
  v_result jsonb;
  v_count int := 0;
  v_errors int := 0;
  v_coach_client_id uuid;
BEGIN
  SELECT array_agg(id ORDER BY start_at), MIN(coach_client_id) 
  INTO v_event_ids, v_coach_client_id
  FROM events 
  WHERE series_id = p_series_id AND session_status NOT IN ('canceled', 'done')
  FOR UPDATE;
  
  IF v_event_ids IS NULL OR array_length(v_event_ids, 1) = 0 THEN
    RETURN jsonb_build_object(
      'series_id', p_series_id, 
      'canceled_count', 0, 
      'message', 'No cancellable events in series'
    );
  END IF;

  IF p_actor = 'coach' THEN
    PERFORM check_coach_owns_coach_client(v_coach_client_id);
  ELSIF p_actor = 'client' THEN
    PERFORM check_client_owns_coach_client(v_coach_client_id);
  ELSE
    RAISE EXCEPTION 'Invalid actor';
  END IF;

  FOREACH v_event_id IN ARRAY v_event_ids
  LOOP
    BEGIN
      v_result := cancel_event_with_ledger(v_event_id, p_actor, p_now);
      v_results := array_append(v_results, v_result);
      IF (v_result->>'canceled')::boolean IS TRUE OR (v_result->>'already_canceled')::boolean IS TRUE THEN
        v_count := v_count + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      v_results := array_append(v_results, jsonb_build_object(
        'event_id', v_event_id,
        'error', SQLERRM
      ));
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'series_id', p_series_id,
    'canceled_count', v_count,
    'errors_count', v_errors,
    'total_events', array_length(v_event_ids, 1),
    'results', to_jsonb(v_results)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- FASE 9: finalize_past_events (Con economic_warning)
-- =============================================================================

CREATE OR REPLACE FUNCTION finalize_past_events(p_now timestamptz DEFAULT now())
RETURNS jsonb AS $$
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
    
    ELSIF v_event.economic_type = 'single_paid' AND v_event.order_payment_id IS NOT NULL THEN
      UPDATE order_payments SET status = 'due', due_at = p_now 
      WHERE id = v_event.order_payment_id AND status = 'draft';
      
      IF FOUND THEN v_orders_due := v_orders_due + 1; END IF;
      v_can_close := true;
    
    ELSIF v_event.economic_type = 'single_paid' AND v_event.order_payment_id IS NULL THEN
      v_flagged := v_flagged + 1;
      v_warning := 'MISSING_ORDER: evento single_paid senza order_payment';
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- FASE 10: finalize_booking_request (Usa internal)
-- =============================================================================

CREATE OR REPLACE FUNCTION finalize_booking_request(p_request_id uuid)
RETURNS uuid AS $$
DECLARE
  v_request booking_requests%ROWTYPE;
  v_coach_id uuid;
  v_client_user_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_event_id uuid;
  v_conflicts integer;
  v_package_id uuid;
  v_coach_client_id uuid;
  v_default_price int;
BEGIN
  SELECT * INTO v_request FROM booking_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking request not found'; END IF;

  v_coach_client_id := v_request.coach_client_id;

  SELECT cc.coach_id, c.user_id
  INTO v_coach_id, v_client_user_id
  FROM coach_clients cc
  JOIN clients c ON c.id = cc.client_id
  WHERE cc.id = v_coach_client_id;

  IF auth.uid() != v_coach_id AND auth.uid() != v_client_user_id THEN
    RAISE EXCEPTION 'Not authorized to finalize this request';
  END IF;

  IF v_request.status = 'APPROVED' AND v_request.event_id IS NOT NULL THEN
    RETURN v_request.event_id;
  END IF;

  IF v_request.status NOT IN ('PENDING', 'COUNTER_PROPOSED') THEN
    RAISE EXCEPTION 'Request not finalizable';
  END IF;

  IF v_request.status = 'COUNTER_PROPOSED' THEN
    v_start := v_request.counter_proposal_start_at;
    v_end := v_request.counter_proposal_end_at;
  ELSE
    v_start := v_request.requested_start_at;
    v_end := v_request.requested_end_at;
  END IF;

  SELECT COUNT(*) INTO v_conflicts
  FROM events e
  JOIN coach_clients cc ON cc.id = e.coach_client_id
  WHERE cc.coach_id = v_coach_id
    AND e.session_status IS DISTINCT FROM 'canceled'
    AND tstzrange(e.start_at, e.end_at, '[)') && tstzrange(v_start, v_end, '[)');
  IF v_conflicts > 0 THEN RAISE EXCEPTION 'Slot non disponibile'; END IF;

  v_package_id := select_fefo_package_internal(v_coach_client_id, 1, v_end);

  SELECT COALESCE(sessions_1_price, 5000) INTO v_default_price 
  FROM package_settings WHERE coach_id = v_coach_id;

  IF v_package_id IS NOT NULL THEN
    v_event_id := create_event_with_economics_internal(
      v_coach_client_id, 'Appuntamento', v_start, v_end,
      'package', v_package_id, NULL, NULL, NULL, NULL, NULL, NULL, 'client'
    );
  ELSE
    v_event_id := create_event_with_economics_internal(
      v_coach_client_id, 'Appuntamento', v_start, v_end,
      'single_paid', NULL, NULL, NULL, NULL, 
      COALESCE(v_default_price, 5000), NULL, NULL, 'client'
    );
  END IF;

  UPDATE booking_requests SET 
    status = 'APPROVED',
    approved_at = now(),
    finalized_start_at = v_start,
    finalized_end_at = v_end,
    event_id = v_event_id,
    updated_at = now()
  WHERE id = p_request_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- FASE 11: expire_packages
-- =============================================================================

CREATE OR REPLACE FUNCTION expire_packages(p_now timestamptz DEFAULT now())
RETURNS jsonb AS $$
DECLARE
  v_expired_count int := 0;
BEGIN
  UPDATE package 
  SET usage_status = 'suspended'
  WHERE usage_status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at <= p_now;
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'expired_count', v_expired_count,
    'processed_at', p_now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;