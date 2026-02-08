-- Fix existing assignments: mark as DELETED where plan was already deleted
UPDATE client_plan_assignments 
SET status = 'DELETED', ended_at = NOW()
WHERE plan_id IN (
  SELECT id FROM client_plans WHERE deleted_at IS NOT NULL
)
AND status != 'DELETED';