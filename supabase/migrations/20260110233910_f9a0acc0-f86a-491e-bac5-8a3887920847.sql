-- Rimuovere il constraint esistente
ALTER TABLE coach_clients DROP CONSTRAINT IF EXISTS coach_clients_status_check;

-- Ricreare con il valore 'invited'
ALTER TABLE coach_clients 
ADD CONSTRAINT coach_clients_status_check 
CHECK (status = ANY (ARRAY['invited', 'active', 'paused', 'terminated']));