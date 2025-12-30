-- Rimuovi il vecchio check constraint e aggiungine uno nuovo che include appointment_canceled_by_client
ALTER TABLE public.coach_notifications 
DROP CONSTRAINT IF EXISTS coach_notifications_type_check;

ALTER TABLE public.coach_notifications 
ADD CONSTRAINT coach_notifications_type_check 
CHECK (type IN ('autonomous_session_completed', 'client_message', 'plan_completed', 'appointment_canceled_by_client'));