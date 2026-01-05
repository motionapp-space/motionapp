
-- FIX: Aggiunge CHECK constraints mancanti

-- 1. CHECK coerenza campi economici su events
ALTER TABLE events
  ADD CONSTRAINT chk_events_economic_refs CHECK (
    (economic_type = 'package' AND package_id IS NOT NULL AND order_payment_id IS NULL)
    OR (economic_type = 'single_paid' AND order_payment_id IS NOT NULL AND package_id IS NULL)
    OR (economic_type IN ('none', 'free') AND package_id IS NULL AND order_payment_id IS NULL)
  );

-- 2. CHECK coerenza kind/refs su order_payments
ALTER TABLE order_payments
  ADD CONSTRAINT chk_order_kind_refs CHECK (
    (kind = 'single_lesson' AND event_id IS NOT NULL AND package_id IS NULL)
    OR (kind = 'package_purchase' AND package_id IS NOT NULL AND event_id IS NULL)
    OR (kind IN ('charge', 'refund', 'deposit'))
  );
