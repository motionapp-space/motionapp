-- =============================================
-- EMAIL OUTBOX PATTERN - Database Schema
-- =============================================

-- 1.1 Creare enum email_type
CREATE TYPE email_type AS ENUM (
  'client_invite',
  'appointment_request_created',
  'appointment_accepted',
  'appointment_counter_proposed',
  'appointment_cancelled'
);

-- 1.2 Creare enum email_status
CREATE TYPE email_status AS ENUM (
  'pending',
  'sent',
  'failed'
);

-- 1.3 Creare tabella email_messages
CREATE TABLE email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type email_type NOT NULL,
  recipient_user_id uuid REFERENCES users(id),
  sender_user_id uuid REFERENCES users(id),
  to_email text NOT NULL,
  status email_status NOT NULL DEFAULT 'pending',
  template_data jsonb NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  failed_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.4 Indice parziale per il worker (query efficiente su email pending)
CREATE INDEX idx_email_messages_pending 
ON email_messages(scheduled_at) 
WHERE status = 'pending';

-- 1.5 Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_email_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_email_messages_updated_at
  BEFORE UPDATE ON email_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_email_messages_updated_at();

-- 1.6 RLS: Abilitare ma senza policy = solo service role può accedere
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

-- Commento esplicativo
COMMENT ON TABLE email_messages IS 'Email outbox table. Access restricted to service role only. No user policies.';
COMMENT ON COLUMN email_messages.template_data IS 'Snapshot of all data needed for email template. No joins at send time.';
COMMENT ON COLUMN email_messages.sender_user_id IS 'User who caused the event (coach, client, or NULL if system)';