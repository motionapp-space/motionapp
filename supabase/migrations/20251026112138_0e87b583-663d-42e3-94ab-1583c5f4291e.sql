-- Drop existing objects if they exist (idempotent migration)
DROP TABLE IF EXISTS public.booking_requests CASCADE;
DROP TABLE IF EXISTS public.booking_settings CASCADE;
DROP TABLE IF EXISTS public.availability_windows CASCADE;
DROP TABLE IF EXISTS public.out_of_office_blocks CASCADE;
DROP TYPE IF EXISTS booking_request_status CASCADE;
DROP TYPE IF EXISTS approval_mode CASCADE;

-- Create enum for booking request status
CREATE TYPE booking_request_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'COUNTER_PROPOSED');

-- Create enum for approval mode
CREATE TYPE approval_mode AS ENUM ('AUTO', 'MANUAL');

-- Booking requests table
CREATE TABLE public.booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  requested_start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  requested_end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status booking_request_status NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  counter_proposal_start_at TIMESTAMP WITH TIME ZONE,
  counter_proposal_end_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Booking settings table (one per coach)
CREATE TABLE public.booking_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL UNIQUE REFERENCES public.coaches(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  min_advance_notice_hours INTEGER NOT NULL DEFAULT 24,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  approval_mode approval_mode NOT NULL DEFAULT 'MANUAL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Availability windows table
CREATE TABLE public.availability_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Out of office blocks table
CREATE TABLE public.out_of_office_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_booking_requests_coach_id ON public.booking_requests(coach_id);
CREATE INDEX idx_booking_requests_client_id ON public.booking_requests(client_id);
CREATE INDEX idx_booking_requests_status ON public.booking_requests(status);
CREATE INDEX idx_booking_requests_start_at ON public.booking_requests(requested_start_at);
CREATE INDEX idx_availability_windows_coach_id ON public.availability_windows(coach_id);
CREATE INDEX idx_out_of_office_blocks_coach_id ON public.out_of_office_blocks(coach_id);

-- Enable RLS
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.out_of_office_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_requests
CREATE POLICY "Coaches can view booking requests for their clients"
  ON public.booking_requests FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create booking requests"
  ON public.booking_requests FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their booking requests"
  ON public.booking_requests FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their booking requests"
  ON public.booking_requests FOR DELETE
  USING (coach_id = auth.uid());

-- RLS Policies for booking_settings
CREATE POLICY "Coaches can view their own booking settings"
  ON public.booking_settings FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert their own booking settings"
  ON public.booking_settings FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own booking settings"
  ON public.booking_settings FOR UPDATE
  USING (coach_id = auth.uid());

-- RLS Policies for availability_windows
CREATE POLICY "Coaches can view their own availability windows"
  ON public.availability_windows FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create their own availability windows"
  ON public.availability_windows FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own availability windows"
  ON public.availability_windows FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own availability windows"
  ON public.availability_windows FOR DELETE
  USING (coach_id = auth.uid());

-- RLS Policies for out_of_office_blocks
CREATE POLICY "Coaches can view their own OOO blocks"
  ON public.out_of_office_blocks FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create their own OOO blocks"
  ON public.out_of_office_blocks FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own OOO blocks"
  ON public.out_of_office_blocks FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own OOO blocks"
  ON public.out_of_office_blocks FOR DELETE
  USING (coach_id = auth.uid());

-- Trigger for updated_at on booking_requests
CREATE TRIGGER update_booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_updated_at();

-- Trigger for updated_at on booking_settings
CREATE TRIGGER update_booking_settings_updated_at
  BEFORE UPDATE ON public.booking_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_updated_at();