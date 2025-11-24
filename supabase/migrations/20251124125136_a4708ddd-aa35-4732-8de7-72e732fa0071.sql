-- Add is_in_use field to client_plans
ALTER TABLE client_plans
ADD COLUMN is_in_use boolean DEFAULT false NOT NULL;

-- Add comment
COMMENT ON COLUMN client_plans.is_in_use IS 'Indica se questo piano è attualmente in uso dal cliente (max 3 consigliati)';

-- Index for performance
CREATE INDEX idx_client_plans_is_in_use ON client_plans(client_id, is_in_use) WHERE is_in_use = true;