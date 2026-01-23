-- ============================================
-- CLIENT NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE public.client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'appointment_confirmed',
    'appointment_canceled_by_coach',
    'appointment_canceled_confirmed',
    'counter_proposal_received',
    'booking_request_canceled',
    'booking_request_declined'
  )),
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  related_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- Indexes for performance
CREATE INDEX idx_client_notifications_client_id ON public.client_notifications(client_id);
CREATE INDEX idx_client_notifications_is_read ON public.client_notifications(client_id, is_read);
CREATE INDEX idx_client_notifications_created_at ON public.client_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can read own notifications"
  ON public.client_notifications FOR SELECT
  USING (client_id IN (
    SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Clients can update own notifications"
  ON public.client_notifications FOR UPDATE
  USING (client_id IN (
    SELECT c.id FROM public.clients c WHERE c.user_id = auth.uid()
  ));

-- ============================================
-- TRIGGER 1: Appuntamento Confermato (booking_requests.status = 'APPROVED')
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_client_booking_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'APPROVED') THEN
    INSERT INTO public.client_notifications (client_id, type, title, message, related_id, related_type)
    SELECT 
      cc.client_id,
      'appointment_confirmed',
      'Appuntamento confermato',
      'Appuntamento del ' || to_char(COALESCE(NEW.finalized_start_at, NEW.requested_start_at) AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI') || ' confermato',
      NEW.id,
      'booking_request'
    FROM public.coach_clients cc WHERE cc.id = NEW.coach_client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_client_booking_approved
  AFTER UPDATE ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_booking_approved();

-- ============================================
-- TRIGGER 2: Controproposta Ricevuta (booking_requests.status = 'COUNTER_PROPOSAL')
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_client_counter_proposal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COUNTER_PROPOSAL' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'COUNTER_PROPOSAL') THEN
    INSERT INTO public.client_notifications (client_id, type, title, message, related_id, related_type)
    SELECT 
      cc.client_id,
      'counter_proposal_received',
      'Proposta nuovo orario',
      'Il coach propone: ' || to_char(NEW.counter_proposal_start_at AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI'),
      NEW.id,
      'booking_request'
    FROM public.coach_clients cc WHERE cc.id = NEW.coach_client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_client_counter_proposal
  AFTER UPDATE ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_counter_proposal();

-- ============================================
-- TRIGGER 3: Richiesta Rifiutata (booking_requests.status = 'DECLINED')
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_client_booking_declined()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'DECLINED' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'DECLINED') THEN
    INSERT INTO public.client_notifications (client_id, type, title, message, related_id, related_type)
    SELECT 
      cc.client_id,
      'booking_request_declined',
      'Richiesta rifiutata',
      'La tua richiesta del ' || to_char(NEW.requested_start_at AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI') || ' è stata rifiutata',
      NEW.id,
      'booking_request'
    FROM public.coach_clients cc WHERE cc.id = NEW.coach_client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_client_booking_declined
  AFTER UPDATE ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_booking_declined();

-- ============================================
-- TRIGGER 4: Richiesta Annullata dal Cliente (booking_requests.status = 'CANCELED_BY_CLIENT')
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_client_booking_canceled()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'CANCELED_BY_CLIENT' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'CANCELED_BY_CLIENT') THEN
    INSERT INTO public.client_notifications (client_id, type, title, message, related_id, related_type)
    SELECT 
      cc.client_id,
      'booking_request_canceled',
      'Richiesta annullata',
      'Hai annullato la richiesta del ' || to_char(NEW.requested_start_at AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI'),
      NEW.id,
      'booking_request'
    FROM public.coach_clients cc WHERE cc.id = NEW.coach_client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_client_booking_canceled
  AFTER UPDATE ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_booking_canceled();

-- ============================================
-- TRIGGER 5: Appuntamento Annullato dal Coach (events.session_status = 'canceled')
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_client_event_canceled()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when session_status changes to 'canceled'
  IF NEW.session_status = 'canceled' AND (OLD.session_status IS NULL OR OLD.session_status IS DISTINCT FROM 'canceled') THEN
    -- Check if this is a client appointment (has coach_client_id)
    IF NEW.coach_client_id IS NOT NULL THEN
      INSERT INTO public.client_notifications (client_id, type, title, message, related_id, related_type)
      SELECT 
        cc.client_id,
        'appointment_canceled_by_coach',
        'Appuntamento annullato',
        'Il coach ha annullato l''appuntamento del ' || to_char(NEW.start_at AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI'),
        NEW.id,
        'event'
      FROM public.coach_clients cc WHERE cc.id = NEW.coach_client_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_client_event_canceled
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_event_canceled();