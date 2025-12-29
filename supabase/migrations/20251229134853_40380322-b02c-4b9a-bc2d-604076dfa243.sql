-- Permette ai clienti autenticati di vedere la propria relazione con il coach
CREATE POLICY "Clients can view own coach relationship"
ON public.coach_clients
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id 
    FROM public.clients 
    WHERE auth_user_id = auth.uid()
  )
);