
-- ============================================================
-- FASE 2: Trigger on package INSERT -> create order
-- ============================================================

CREATE OR REPLACE FUNCTION public.on_package_insert_create_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_status text;
  v_paid_at timestamptz;
  v_coach_id uuid;
  v_product_id uuid;
BEGIN
  -- Skip technical packages and free packages
  IF NEW.is_single_technical = true OR COALESCE(NEW.price_total_cents, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  -- Determine order status based on package payment_status
  IF NEW.payment_status = 'paid' THEN
    v_order_status := 'paid';
    v_paid_at := NOW();
  ELSE
    v_order_status := 'due';
    v_paid_at := NULL;
  END IF;

  -- Lookup coach_id for product matching
  SELECT coach_id INTO v_coach_id FROM coach_clients WHERE id = NEW.coach_client_id;

  -- Try to find matching product by credits_amount
  IF v_coach_id IS NOT NULL THEN
    SELECT id INTO v_product_id 
    FROM products 
    WHERE coach_id = v_coach_id 
      AND type = 'session_pack' 
      AND credits_amount = NEW.total_sessions 
      AND is_active = true 
    ORDER BY sort_order 
    LIMIT 1;
  END IF;

  INSERT INTO orders (
    coach_client_id,
    package_id,
    product_id,
    kind,
    status,
    amount_cents,
    currency_code,
    due_at,
    paid_at,
    created_by
  ) VALUES (
    NEW.coach_client_id,
    NEW.package_id,
    v_product_id,
    'package_purchase',
    v_order_status,
    NEW.price_total_cents,
    NEW.currency_code,
    NOW(),
    v_paid_at,
    v_coach_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_package_insert_create_order
  AFTER INSERT ON public.package
  FOR EACH ROW
  EXECUTE FUNCTION public.on_package_insert_create_order();

-- ============================================================
-- FASE 2.2: Backfill existing packages (2 real packages)
-- ============================================================

INSERT INTO orders (coach_client_id, package_id, kind, status, amount_cents, currency_code, due_at)
SELECT 
  p.coach_client_id,
  p.package_id,
  'package_purchase',
  CASE WHEN p.payment_status = 'paid' THEN 'paid' ELSE 'due' END,
  p.price_total_cents,
  p.currency_code,
  p.created_at
FROM package p
WHERE p.is_single_technical = false
  AND COALESCE(p.price_total_cents, 0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.package_id = p.package_id
  );

-- ============================================================
-- FASE 3: RPC mark_order_as_paid
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_order_as_paid(
  p_order_id uuid,
  p_external_payment_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order orders%ROWTYPE;
BEGIN
  -- Update order atomically
  UPDATE orders 
  SET 
    status = 'paid', 
    paid_at = NOW(), 
    external_payment_id = COALESCE(p_external_payment_id, external_payment_id)
  WHERE id = p_order_id 
    AND status IN ('draft', 'due')
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or already paid (id: %)', p_order_id;
  END IF;

  -- Sync package payment_status if this is a package purchase
  IF v_order.kind = 'package_purchase' AND v_order.package_id IS NOT NULL THEN
    UPDATE package 
    SET payment_status = 'paid' 
    WHERE package_id = v_order.package_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'status', 'paid',
    'kind', v_order.kind,
    'amount_cents', v_order.amount_cents,
    'paid_at', v_order.paid_at,
    'package_id', v_order.package_id,
    'event_id', v_order.event_id
  );
END;
$$;
