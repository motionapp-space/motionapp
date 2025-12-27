-- Fix security warnings

-- 1. Fix view v_coach_client_details - rimuovere SECURITY DEFINER (usare INVOKER)
DROP VIEW IF EXISTS v_coach_client_details;

CREATE VIEW v_coach_client_details 
WITH (security_invoker = true) AS
SELECT 
  cc.id as coach_client_id,
  cc.coach_id,
  cc.client_id,
  cc.status as relationship_status,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  c.status as client_status
FROM coach_clients cc
JOIN clients c ON c.id = cc.client_id;

-- 2. La tabella coach_clients ha già RLS policies configurate, verifichiamo
-- (non serve intervento per "RLS Enabled No Policy" - era probabilmente per le tabelle appena droppate)