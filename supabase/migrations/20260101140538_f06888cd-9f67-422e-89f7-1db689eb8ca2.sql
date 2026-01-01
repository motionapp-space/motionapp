-- Create SECURITY DEFINER function to get client_id without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_client_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM clients WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Clients can view own coach relationship" ON coach_clients;

-- Recreate the policy using the SECURITY DEFINER function
CREATE POLICY "Clients can view own coach relationship"
ON coach_clients FOR SELECT
USING (client_id = get_my_client_id());