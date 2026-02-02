-- Fix legacy constraint for single_paid events
-- The new architecture uses orders.event_id instead of events.order_payment_id

-- 1. Remove the legacy constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS chk_events_economic_refs;

-- 2. Recreate with updated logic (order_payment_id no longer required for single_paid)
ALTER TABLE public.events ADD CONSTRAINT chk_events_economic_refs CHECK (
  (economic_type = 'package' AND package_id IS NOT NULL AND order_payment_id IS NULL)
  OR (economic_type = 'single_paid' AND package_id IS NULL)
  OR (economic_type IN ('none', 'free') AND package_id IS NULL AND order_payment_id IS NULL)
);