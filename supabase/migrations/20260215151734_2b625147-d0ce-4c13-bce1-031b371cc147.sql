ALTER TABLE events DROP CONSTRAINT events_source_check;
ALTER TABLE events ADD CONSTRAINT events_source_check
  CHECK (source = ANY (ARRAY['manual', 'generated', 'client', 'coach']));