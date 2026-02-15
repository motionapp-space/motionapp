
-- Ricreare le policy SELECT con target esplicito "authenticated"
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Coaches can view client profiles" ON public.users;
CREATE POLICY "Coaches can view client profiles" 
  ON public.users FOR SELECT 
  TO authenticated
  USING (
    has_role(auth.uid(), 'coach'::app_role) 
    AND id IN (
      SELECT c.user_id FROM clients c
      JOIN coach_clients cc ON cc.client_id = c.id
      WHERE cc.coach_id = auth.uid() AND c.user_id IS NOT NULL
    )
  );

-- Aggiornare anche la policy UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  TO authenticated
  USING (id = auth.uid());
