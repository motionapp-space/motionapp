-- FASE 1: RLS Policies per Client Session Tracking
-- Permette ai client di gestire le proprie sessioni e actuals

-- 1. Client INSERT su training_sessions
CREATE POLICY "client_insert_own_training_sessions"
ON public.training_sessions FOR INSERT
TO authenticated
WITH CHECK (
  coach_client_id IN (
    SELECT cc.id FROM public.coach_clients cc
    JOIN public.clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- 2. Client UPDATE su training_sessions
CREATE POLICY "client_update_own_training_sessions"
ON public.training_sessions FOR UPDATE
TO authenticated
USING (
  coach_client_id IN (
    SELECT cc.id FROM public.coach_clients cc
    JOIN public.clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
)
WITH CHECK (
  coach_client_id IN (
    SELECT cc.id FROM public.coach_clients cc
    JOIN public.clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- 3. Client INSERT su exercise_actuals
CREATE POLICY "client_insert_own_exercise_actuals"
ON public.exercise_actuals FOR INSERT
TO authenticated
WITH CHECK (
  session_id IN (
    SELECT ts.id FROM public.training_sessions ts
    JOIN public.coach_clients cc ON cc.id = ts.coach_client_id
    JOIN public.clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- 4. Client UPDATE su exercise_actuals
CREATE POLICY "client_update_own_exercise_actuals"
ON public.exercise_actuals FOR UPDATE
TO authenticated
USING (
  session_id IN (
    SELECT ts.id FROM public.training_sessions ts
    JOIN public.coach_clients cc ON cc.id = ts.coach_client_id
    JOIN public.clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
)
WITH CHECK (
  session_id IN (
    SELECT ts.id FROM public.training_sessions ts
    JOIN public.coach_clients cc ON cc.id = ts.coach_client_id
    JOIN public.clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- 5. Client DELETE su exercise_actuals (per undo)
CREATE POLICY "client_delete_own_exercise_actuals"
ON public.exercise_actuals FOR DELETE
TO authenticated
USING (
  session_id IN (
    SELECT ts.id FROM public.training_sessions ts
    JOIN public.coach_clients cc ON cc.id = ts.coach_client_id
    JOIN public.clients c ON c.id = cc.client_id
    WHERE c.user_id = auth.uid()
  )
);