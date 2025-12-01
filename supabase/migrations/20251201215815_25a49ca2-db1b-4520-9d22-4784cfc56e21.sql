-- Add RLS policy for clients to view their own profile
CREATE POLICY "Clients can view own profile" 
ON public.clients 
FOR SELECT 
TO authenticated 
USING (auth_user_id = auth.uid());

-- Add RLS policy for clients to view their own appointments
CREATE POLICY "Clients can view own appointments" 
ON public.events 
FOR SELECT 
TO authenticated 
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);