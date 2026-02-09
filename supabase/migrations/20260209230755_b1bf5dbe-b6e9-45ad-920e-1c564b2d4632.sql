ALTER TABLE client_notifications DROP CONSTRAINT client_notifications_type_check;

ALTER TABLE client_notifications ADD CONSTRAINT client_notifications_type_check CHECK (type = ANY (ARRAY[
  'appointment_confirmed',
  'appointment_canceled_by_coach',
  'appointment_canceled_confirmed',
  'counter_proposal_received',
  'booking_request_canceled',
  'booking_request_declined',
  'plan_assigned'
]));