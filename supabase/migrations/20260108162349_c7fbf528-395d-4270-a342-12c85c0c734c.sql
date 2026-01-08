-- Aggiungere valore mancante all'enum ledger_reason
ALTER TYPE ledger_reason ADD VALUE IF NOT EXISTS 'BOOKING_CONFIRMED';