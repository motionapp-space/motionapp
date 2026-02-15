
-- Hardening: aggiungere TO authenticated alle policy di client_invites

DROP POLICY IF EXISTS "Coaches can view own invites" ON public.client_invites;
CREATE POLICY "Coaches can view own invites" 
  ON public.client_invites FOR SELECT 
  TO authenticated
  USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can create invites" ON public.client_invites;
CREATE POLICY "Coaches can create invites" 
  ON public.client_invites FOR INSERT 
  TO authenticated
  WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can update own invites" ON public.client_invites;
CREATE POLICY "Coaches can update own invites" 
  ON public.client_invites FOR UPDATE 
  TO authenticated
  USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can delete own invites" ON public.client_invites;
CREATE POLICY "Coaches can delete own invites" 
  ON public.client_invites FOR DELETE 
  TO authenticated
  USING (coach_id = auth.uid());
