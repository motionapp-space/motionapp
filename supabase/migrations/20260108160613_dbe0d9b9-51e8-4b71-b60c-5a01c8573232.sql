-- =====================================================
-- HOLD AT CREATE: Booking Request Package Integration
-- =====================================================

-- 1. Aggiungere nuovi valori all'enum ledger_reason
ALTER TYPE ledger_reason ADD VALUE IF NOT EXISTS 'REQUEST_CREATE';
ALTER TYPE ledger_reason ADD VALUE IF NOT EXISTS 'REQUEST_CANCEL';

-- 2. Aggiungere colonna booking_request_id a package_ledger
ALTER TABLE package_ledger
ADD COLUMN IF NOT EXISTS booking_request_id uuid REFERENCES booking_requests(id) ON DELETE SET NULL;

-- 3. Creare unique index per idempotenza su booking_request_id
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ledger_request_type 
ON package_ledger (package_id, booking_request_id, type) 
WHERE booking_request_id IS NOT NULL;

-- 4. Funzione trigger per gestire hold su booking request
CREATE OR REPLACE FUNCTION handle_booking_request_package_hold()
RETURNS TRIGGER AS $$
DECLARE
  v_pkg record;
  v_available int;
  v_rows_affected int;
BEGIN
  -- Solo per economic_type = 'package' con selected_package_id
  IF NEW.economic_type != 'package' OR NEW.selected_package_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ===== INSERT: crea HOLD =====
  IF TG_OP = 'INSERT' THEN
    -- Lock e valida pacchetto
    SELECT * INTO v_pkg FROM package 
    WHERE package_id = NEW.selected_package_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pacchetto non trovato: %', NEW.selected_package_id;
    END IF;
    
    IF v_pkg.usage_status != 'active' THEN
      RAISE EXCEPTION 'Pacchetto non attivo (status: %)', v_pkg.usage_status;
    END IF;
    
    v_available := v_pkg.total_sessions - v_pkg.consumed_sessions - v_pkg.on_hold_sessions;
    IF v_available < 1 THEN
      RAISE EXCEPTION 'Nessun credito disponibile nel pacchetto (available: %)', v_available;
    END IF;
    
    -- Inserisci ledger entry (idempotente via unique index)
    INSERT INTO package_ledger (
      package_id, booking_request_id, type, reason, delta_hold, delta_consumed, note
    ) VALUES (
      NEW.selected_package_id, NEW.id, 'HOLD_CREATE', 'REQUEST_CREATE', 1, 0,
      'Hold creato alla creazione della richiesta di prenotazione'
    ) ON CONFLICT (package_id, booking_request_id, type) WHERE booking_request_id IS NOT NULL
    DO NOTHING;
    
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    
    IF v_rows_affected > 0 THEN
      UPDATE package SET on_hold_sessions = on_hold_sessions + 1
      WHERE package_id = NEW.selected_package_id;
    END IF;
    
    RETURN NEW;
  END IF;

  -- ===== UPDATE a stato terminale: rilascia HOLD =====
  IF TG_OP = 'UPDATE' THEN
    -- Da stato attivo a cancellato/rifiutato
    IF OLD.status IN ('PENDING', 'COUNTER_PROPOSED') 
       AND NEW.status IN ('CANCELED_BY_CLIENT', 'DECLINED') THEN
      
      -- Controlla se esiste un HOLD_CREATE per questa request (non già trasferito a evento)
      IF EXISTS (
        SELECT 1 FROM package_ledger 
        WHERE booking_request_id = NEW.id 
        AND type = 'HOLD_CREATE'
        AND calendar_event_id IS NULL
      ) THEN
        -- Rilascia hold
        INSERT INTO package_ledger (
          package_id, booking_request_id, type, reason, delta_hold, delta_consumed, note
        ) VALUES (
          NEW.selected_package_id, NEW.id, 'HOLD_RELEASE', 'REQUEST_CANCEL', -1, 0,
          CASE 
            WHEN NEW.status = 'CANCELED_BY_CLIENT' THEN 'Hold rilasciato: richiesta annullata dal cliente'
            ELSE 'Hold rilasciato: richiesta rifiutata dal coach'
          END
        ) ON CONFLICT (package_id, booking_request_id, type) WHERE booking_request_id IS NOT NULL
        DO NOTHING;
        
        GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
        
        IF v_rows_affected > 0 THEN
          UPDATE package SET on_hold_sessions = GREATEST(0, on_hold_sessions - 1)
          WHERE package_id = NEW.selected_package_id;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 5. Creare trigger
DROP TRIGGER IF EXISTS trg_booking_request_package_hold ON booking_requests;

CREATE TRIGGER trg_booking_request_package_hold
AFTER INSERT OR UPDATE ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION handle_booking_request_package_hold();

-- 6. Drop e ricrea finalize_booking_request con logica per riusare hold esistente
DROP FUNCTION IF EXISTS finalize_booking_request(uuid);

CREATE OR REPLACE FUNCTION finalize_booking_request(p_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- 7. Commenti
COMMENT ON FUNCTION handle_booking_request_package_hold() IS 
'Gestisce automaticamente l''hold dei crediti pacchetto per le booking requests:
- INSERT con economic_type=package: crea HOLD_CREATE (+1 on_hold)
- UPDATE a CANCELED/DECLINED: crea HOLD_RELEASE (-1 on_hold)
- Idempotente via unique index su (package_id, booking_request_id, type)
- Race-condition safe via FOR UPDATE lock sul pacchetto';

COMMENT ON FUNCTION finalize_booking_request(uuid) IS
'Approva una booking request e crea l''evento calendario.
Se la request ha già un hold (nuovo flusso), lo collega all''evento.
Se non ha hold (legacy), ne crea uno nuovo.
Fallback a single_paid se pacchetto non valido/disponibile.';