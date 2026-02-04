-- Fix view security: use SECURITY INVOKER (default) to enforce RLS
DROP VIEW IF EXISTS v_coach_client_details;

CREATE VIEW v_coach_client_details
WITH (security_invoker = true)
AS
SELECT 
    cc.id AS coach_client_id,
    cc.coach_id,
    cc.client_id,
    cc.status AS relationship_status,
    c.first_name,
    c.last_name,
    c.email,
    c.phone
FROM coach_clients cc
JOIN clients c ON c.id = cc.client_id;