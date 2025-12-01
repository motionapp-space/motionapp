-- Add auth_user_id column to clients table for future client authentication
-- Nullable, no default, no foreign key, no triggers, no RLS changes
ALTER TABLE clients
ADD COLUMN auth_user_id uuid NULL;