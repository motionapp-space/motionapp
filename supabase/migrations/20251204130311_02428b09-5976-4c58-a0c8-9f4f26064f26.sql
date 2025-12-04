-- Aggiungi stato CANCELED_BY_CLIENT all'enum esistente
ALTER TYPE booking_request_status ADD VALUE IF NOT EXISTS 'CANCELED_BY_CLIENT';