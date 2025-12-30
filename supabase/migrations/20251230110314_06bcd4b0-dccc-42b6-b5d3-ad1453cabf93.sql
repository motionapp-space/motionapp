-- Policy per permettere ai coach di leggere i dati delle sessioni dei propri clienti
CREATE POLICY "Coaches can view actuals for their client sessions"
ON public.exercise_actuals
FOR SELECT
TO authenticated
USING (
  session_id IN (
    SELECT ts.id 
    FROM training_sessions ts
    JOIN coach_clients cc ON cc.id = ts.coach_client_id
    WHERE cc.coach_id = auth.uid()
  )
);

-- Policy per permettere ai coach di inserire dati nelle sessioni dei propri clienti
CREATE POLICY "Coaches can insert actuals for their client sessions"
ON public.exercise_actuals
FOR INSERT
TO authenticated
WITH CHECK (
  session_id IN (
    SELECT ts.id 
    FROM training_sessions ts
    JOIN coach_clients cc ON cc.id = ts.coach_client_id
    WHERE cc.coach_id = auth.uid()
  )
);

-- Policy per permettere ai coach di aggiornare dati nelle sessioni dei propri clienti
CREATE POLICY "Coaches can update actuals for their client sessions"
ON public.exercise_actuals
FOR UPDATE
TO authenticated
USING (
  session_id IN (
    SELECT ts.id 
    FROM training_sessions ts
    JOIN coach_clients cc ON cc.id = ts.coach_client_id
    WHERE cc.coach_id = auth.uid()
  )
);

-- Policy per permettere ai coach di eliminare dati nelle sessioni dei propri clienti
CREATE POLICY "Coaches can delete actuals for their client sessions"
ON public.exercise_actuals
FOR DELETE
TO authenticated
USING (
  session_id IN (
    SELECT ts.id 
    FROM training_sessions ts
    JOIN coach_clients cc ON cc.id = ts.coach_client_id
    WHERE cc.coach_id = auth.uid()
  )
);

-- Policy per permettere ai clienti di leggere i propri dati di esercizio
CREATE POLICY "Clients can view own exercise actuals"
ON public.exercise_actuals
FOR SELECT
TO authenticated
USING (
  session_id IN (
    SELECT ts.id 
    FROM training_sessions ts
    JOIN coach_clients cc ON cc.id = ts.coach_client_id
    JOIN clients c ON c.id = cc.client_id
    WHERE c.auth_user_id = auth.uid()
  )
);