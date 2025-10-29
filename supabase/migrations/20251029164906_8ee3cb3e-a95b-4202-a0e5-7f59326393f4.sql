-- Training sessions table
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  client_id UUID NOT NULL,
  plan_id UUID,
  day_id TEXT,
  event_id UUID,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exercise actuals (set-by-set logs)
CREATE TABLE IF NOT EXISTS public.exercise_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  day_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  group_id TEXT,
  exercise_id TEXT NOT NULL,
  set_index INT NOT NULL,
  reps TEXT NOT NULL,
  load TEXT,
  rest TEXT,
  rpe INT,
  note TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_actuals ENABLE ROW LEVEL SECURITY;

-- RLS policies for training_sessions
CREATE POLICY "Coaches can view their own sessions"
  ON public.training_sessions FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create their own sessions"
  ON public.training_sessions FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own sessions"
  ON public.training_sessions FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own sessions"
  ON public.training_sessions FOR DELETE
  USING (auth.uid() = coach_id);

-- RLS policies for exercise_actuals
CREATE POLICY "Coaches can view actuals from their sessions"
  ON public.exercise_actuals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions
      WHERE training_sessions.id = exercise_actuals.session_id
      AND training_sessions.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create actuals in their sessions"
  ON public.exercise_actuals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_sessions
      WHERE training_sessions.id = exercise_actuals.session_id
      AND training_sessions.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update actuals in their sessions"
  ON public.exercise_actuals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions
      WHERE training_sessions.id = exercise_actuals.session_id
      AND training_sessions.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete actuals in their sessions"
  ON public.exercise_actuals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions
      WHERE training_sessions.id = exercise_actuals.session_id
      AND training_sessions.coach_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_client ON public.training_sessions(coach_id, client_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_event ON public.training_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_started_at ON public.training_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_actuals_session ON public.exercise_actuals(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_actuals_exercise ON public.exercise_actuals(exercise_id);

-- Trigger to update updated_at
CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON public.training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_updated_at();

-- Extend events table to support linked_plan_id and linked_day_id
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS linked_plan_id UUID;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS linked_day_id TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS session_status TEXT CHECK (session_status IN ('scheduled', 'done', 'canceled', 'no_show'));