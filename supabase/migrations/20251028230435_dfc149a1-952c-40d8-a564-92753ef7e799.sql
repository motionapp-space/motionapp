-- Create partial unique index to enforce one IN_CORSO plan per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_plan_per_client
ON client_plans (client_id)
WHERE status = 'IN_CORSO' AND is_visible = true;