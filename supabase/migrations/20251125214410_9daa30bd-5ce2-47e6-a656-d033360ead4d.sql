-- Update training_sessions status check constraint to include 'cancelled'
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_status_check;
ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_status_check 
  CHECK (status = ANY (ARRAY['planned', 'in_progress', 'completed', 'no_show', 'cancelled']));