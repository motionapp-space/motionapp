-- Aggiorna la pulizia sessioni zombie per usare 'discarded' invece di 'cancelled'
-- (La vecchia migrazione 20251127115340 usava 'cancelled' che non è più valido)
UPDATE training_sessions 
SET status = 'discarded', 
    ended_at = COALESCE(ended_at, NOW())
WHERE status = 'in_progress' 
  AND started_at < NOW() - INTERVAL '24 hours';