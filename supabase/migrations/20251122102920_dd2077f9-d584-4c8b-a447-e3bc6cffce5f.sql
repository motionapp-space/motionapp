-- FASE 5: Aggiungere colonna source alla tabella events
-- Permette di distinguere eventi creati da coach vs clienti

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' 
CHECK (source IN ('manual', 'generated', 'client'));

COMMENT ON COLUMN events.source IS 'Origine dell''evento: manual=creato da coach, generated=auto-generato, client=prenotato da cliente';

-- Aggiornare eventi esistenti
UPDATE events SET source = 'manual' WHERE source IS NULL;