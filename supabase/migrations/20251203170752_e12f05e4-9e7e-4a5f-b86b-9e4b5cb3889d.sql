-- RLS Policies for Client Workouts (Read-Only)

-- Policy for client_plans: Clients can view their own plans
CREATE POLICY "Clients can view their own plans"
ON public.client_plans
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);

-- Policy for training_sessions: Clients can view their own training sessions
CREATE POLICY "Clients can view their own training sessions"
ON public.training_sessions
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  )
);

-- Policy for exercise_actuals: Clients can view their own exercise logs
CREATE POLICY "Clients can view their own exercise logs"
ON public.exercise_actuals
FOR SELECT
TO authenticated
USING (
  session_id IN (
    SELECT id
    FROM public.training_sessions
    WHERE client_id IN (
      SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
    )
  )
);