-- Elimina la funzione duplicata con ordine parametri invertito
-- Mantenendo: cancel_event_with_ledger(p_event_id uuid, p_actor text, p_now timestamptz)
DROP FUNCTION IF EXISTS public.cancel_event_with_ledger(text, uuid, timestamptz);