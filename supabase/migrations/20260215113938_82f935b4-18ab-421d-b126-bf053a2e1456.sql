
-- Passo 1: Aggiungere paid_amount_cents alla tabella orders
ALTER TABLE orders
  ADD COLUMN paid_amount_cents integer NOT NULL DEFAULT 0;

-- Backfill: ordini già pagati hanno paid_amount_cents = amount_cents
UPDATE orders
SET paid_amount_cents = amount_cents
WHERE status = 'paid';

-- Passo 2: Aggiornare RPC mark_order_as_paid con paid_amount_cents
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
  UPDATE orders 
  SET 
    status = 'paid', 
    paid_at = NOW(), 
    paid_amount_cents = amount_cents,
    external_payment_id = COALESCE(p_external_payment_id, external_payment_id)
  WHERE id = p_order_id 
    AND status IN ('draft', 'due')
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or already paid (id: %)', p_order_id;
  END IF;

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
