-- Add source column to differentiate PT-led vs autonomous sessions
ALTER TABLE training_sessions 
ADD COLUMN source TEXT NOT NULL DEFAULT 'with_coach'
CHECK (source IN ('with_coach', 'autonomous'));

-- Backfill existing data: if event_id exists, it's with_coach
UPDATE training_sessions 
SET source = CASE 
  WHEN event_id IS NOT NULL THEN 'with_coach'
  ELSE 'autonomous'
END;

-- Add comment
COMMENT ON COLUMN training_sessions.source IS 
'Session source: with_coach (PT-led, has event_id), autonomous (client-led, no event_id)';

-- Add constraint: autonomous sessions must have plan_id and day_id
ALTER TABLE training_sessions 
ADD CONSTRAINT autonomous_sessions_require_plan_day
CHECK (
  source != 'autonomous' OR 
  (plan_id IS NOT NULL AND day_id IS NOT NULL)
);

COMMENT ON CONSTRAINT autonomous_sessions_require_plan_day ON training_sessions IS
'Autonomous sessions must always have plan_id and day_id';

-- Create notifications table
CREATE TABLE coach_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('autonomous_session_completed', 'client_message', 'plan_completed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Index for performance
CREATE INDEX idx_coach_notifications_coach_unread 
ON coach_notifications(coach_id, is_read, created_at DESC);

-- RLS policies for notifications
ALTER TABLE coach_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own notifications"
ON coach_notifications FOR SELECT
USING (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own notifications"
ON coach_notifications FOR UPDATE
USING (coach_id = auth.uid());

-- Trigger to create notification when autonomous session is completed
CREATE OR REPLACE FUNCTION notify_coach_autonomous_session()
RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
BEGIN
  -- Only for autonomous sessions that change to completed status
  IF NEW.source = 'autonomous' AND NEW.status = 'completed' AND 
     (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get client name
    SELECT first_name || ' ' || last_name INTO client_name
    FROM clients WHERE id = NEW.client_id;
    
    -- Create notification
    INSERT INTO coach_notifications (
      coach_id,
      type,
      title,
      message,
      related_id,
      related_type
    ) VALUES (
      NEW.coach_id,
      'autonomous_session_completed',
      'Sessione autonoma completata',
      client_name || ' ha completato una sessione di allenamento',
      NEW.id,
      'session'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_autonomous_session_completed
AFTER INSERT OR UPDATE ON training_sessions
FOR EACH ROW
EXECUTE FUNCTION notify_coach_autonomous_session();