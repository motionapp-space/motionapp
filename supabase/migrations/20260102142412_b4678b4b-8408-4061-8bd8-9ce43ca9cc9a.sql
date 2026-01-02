-- Migration 1: Add columns to booking_requests for finalization tracking

-- Add event_id to link approved requests to created events
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS event_id uuid NULL REFERENCES public.events(id) ON DELETE SET NULL;

-- Add finalized slot times (the actual times used for the event)
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS finalized_start_at timestamptz NULL;

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS finalized_end_at timestamptz NULL;

-- Add approved timestamp
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS approved_at timestamptz NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.booking_requests.event_id IS 'Reference to created event when request is approved';
COMMENT ON COLUMN public.booking_requests.finalized_start_at IS 'Final start time used for the created event';
COMMENT ON COLUMN public.booking_requests.finalized_end_at IS 'Final end time used for the created event';
COMMENT ON COLUMN public.booking_requests.approved_at IS 'Timestamp when request was approved';

-- Create index for event_id lookups
CREATE INDEX IF NOT EXISTS idx_booking_requests_event_id ON public.booking_requests(event_id) WHERE event_id IS NOT NULL;