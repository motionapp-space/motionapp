-- Create events table for calendar functionality
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  notes TEXT,
  is_all_day BOOLEAN DEFAULT false,
  reminder_offset_minutes INTEGER,
  color TEXT,
  recurrence_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT events_end_after_start CHECK (end_at > start_at)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Coaches can view their own events"
  ON public.events FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create events"
  ON public.events FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own events"
  ON public.events FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own events"
  ON public.events FOR DELETE
  USING (coach_id = auth.uid());

-- Trigger to update updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_updated_at();

-- Index for performance
CREATE INDEX idx_events_coach_id ON public.events(coach_id);
CREATE INDEX idx_events_client_id ON public.events(client_id);
CREATE INDEX idx_events_start_at ON public.events(start_at);
CREATE INDEX idx_events_date_range ON public.events(coach_id, start_at, end_at);