-- Add fields to events table for slot management
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS aligned_to_slot BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'generated', 'client'));

-- Add comment for clarity
COMMENT ON COLUMN events.aligned_to_slot IS 'Whether the event is aligned to a generated slot';
COMMENT ON COLUMN events.source IS 'Origin of the event: manual (coach), generated (system), client (booking)';

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_aligned ON events(aligned_to_slot) WHERE aligned_to_slot = false;