-- Backfill snapshot per sessioni completed senza snapshot
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT id
    FROM public.training_sessions
    WHERE status = 'completed'
      AND plan_day_snapshot IS NULL
  LOOP
    PERFORM public.capture_session_snapshot(r.id);
  END LOOP;
END $$;