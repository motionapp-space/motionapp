-- 1) Prima rimuoviamo il vecchio CHECK constraint
ALTER TABLE training_sessions
DROP CONSTRAINT IF EXISTS training_sessions_status_check;

-- 2) Convertiamo stati legacy in discarded
UPDATE training_sessions
SET status = 'discarded'
WHERE status IN ('cancelled', 'planned', 'no_show');

-- 3) Ricreiamo CHECK constraint con soli 3 valori
ALTER TABLE training_sessions
ADD CONSTRAINT training_sessions_status_check
CHECK (status = ANY (ARRAY['in_progress', 'completed', 'discarded']));