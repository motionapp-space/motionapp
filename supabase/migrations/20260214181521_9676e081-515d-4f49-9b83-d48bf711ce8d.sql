
-- Add p_product_id parameter to create_event_with_economics_internal
CREATE OR REPLACE FUNCTION public.create_event_with_economics_internal(
  p_coach_client_id uuid,
  p_title text,
  p_start_at timestamp with time zone,
  p_end_at timestamp with time zone,
  p_economic_type text,
  p_location text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_series_id uuid DEFAULT NULL,
  p_series_request_id uuid DEFAULT NULL,
  p_package_id uuid DEFAULT NULL,
  p_amount_cents integer DEFAULT NULL,
  p_client_request_id uuid DEFAULT NULL,
  p_source text DEFAULT 'coach',
  p_product_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Get default price from products table
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
    INSERT INTO orders (
      coach_client_id, event_id, kind, status, amount_cents, currency_code, product_id
    ) VALUES (
      p_coach_client_id, v_event_id, 'single_lesson', 'draft', 
      COALESCE(p_amount_cents, v_default_price), 'EUR',
      p_product_id
    )
    RETURNING id INTO v_order_id;
    
    UPDATE events SET order_payment_id = v_order_id WHERE id = v_event_id;
  END IF;

  RETURN v_event_id;
END;
$function$;
