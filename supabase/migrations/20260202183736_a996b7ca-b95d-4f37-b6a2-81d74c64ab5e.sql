-- Rimuove il constraint legacy che blocca 'single_lesson'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS payment_kind_check;