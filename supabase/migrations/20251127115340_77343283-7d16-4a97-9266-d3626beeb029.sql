-- Pulisci sessioni "zombie" (in_progress da più di 24 ore)
UPDATE training_sessions 
SET status = 'cancelled', 
    ended_at = NOW()
WHERE status = 'in_progress' 
  AND started_at < NOW() - INTERVAL '24 hours';