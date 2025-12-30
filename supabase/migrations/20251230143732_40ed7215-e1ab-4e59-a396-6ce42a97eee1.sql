-- Permette ai client di accettare controproposte del coach
-- Condizione: lo status corrente deve essere COUNTER_PROPOSED
CREATE POLICY "Clients can accept counter proposals"
ON public.booking_requests
FOR UPDATE
TO authenticated
USING (
  -- Il client deve essere proprietario della booking request
  coach_client_id IN (
    SELECT cc.id
    FROM coach_clients cc
    JOIN clients c ON c.id = cc.client_id
    WHERE c.auth_user_id = auth.uid()
  )
  -- E lo status attuale deve essere COUNTER_PROPOSED
  AND status = 'COUNTER_PROPOSED'
)
WITH CHECK (
  -- Può solo impostare APPROVED
  status = 'APPROVED'
);