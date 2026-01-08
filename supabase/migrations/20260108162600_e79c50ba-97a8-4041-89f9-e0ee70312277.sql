-- Rimuovere il check constraint esistente
ALTER TABLE coach_notifications DROP CONSTRAINT IF EXISTS coach_notifications_type_check;

-- Ricreare con il nuovo tipo incluso
ALTER TABLE coach_notifications ADD CONSTRAINT coach_notifications_type_check 
  CHECK (type = ANY (ARRAY[
    'autonomous_session_completed', 
    'client_message', 
    'plan_completed', 
    'appointment_canceled_by_client',
    'booking_approved'
  ]));