-- FASE 1: Migrazioni Database per Flusso Invito Cliente
-- Approccio semplificato: manteniamo coach_clients.status come TEXT e aggiungiamo i valori 'invited'

-- 1. Aggiungere INVITATO a client_status (prima di POTENZIALE)
ALTER TYPE client_status ADD VALUE 'INVITATO' BEFORE 'POTENZIALE';

-- 2. Creare ENUM invite_status
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- 3. Creare tabella client_invites
CREATE TABLE public.client_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status invite_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  
  CONSTRAINT check_valid_invite_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indici per performance
CREATE INDEX idx_client_invites_token ON client_invites(token);
CREATE INDEX idx_client_invites_client_id ON client_invites(client_id);
CREATE INDEX idx_client_invites_coach_id ON client_invites(coach_id);
CREATE INDEX idx_client_invites_status ON client_invites(status) WHERE status = 'pending';

-- Abilitare RLS
ALTER TABLE client_invites ENABLE ROW LEVEL SECURITY;

-- Policy per coaches
CREATE POLICY "Coaches can view own invites" ON client_invites
  FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create invites" ON client_invites
  FOR INSERT WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own invites" ON client_invites
  FOR UPDATE USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own invites" ON client_invites
  FOR DELETE USING (coach_id = auth.uid());

-- 4. Aggiornare RPC create_client_with_coach_link per supportare p_with_invite
-- coach_clients.status resta TEXT, usiamo 'invited' come valore
CREATE OR REPLACE FUNCTION public.create_client_with_coach_link(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_sex sex DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_fiscal_code TEXT DEFAULT NULL,
  p_with_invite BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_coach_id UUID := auth.uid();
  v_client_status client_status;
  v_coach_client_status TEXT;
BEGIN
  -- Determina gli stati in base a p_with_invite
  IF p_with_invite THEN
    v_client_status := 'INVITATO';
    v_coach_client_status := 'invited';
  ELSE
    v_client_status := 'POTENZIALE';
    v_coach_client_status := 'active';
  END IF;

  -- Crea il cliente con lo stato appropriato
  INSERT INTO clients (
    first_name,
    last_name,
    email,
    phone,
    birth_date,
    sex,
    notes,
    fiscal_code,
    status
  )
  VALUES (
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_birth_date,
    p_sex,
    p_notes,
    p_fiscal_code,
    v_client_status
  )
  RETURNING id INTO v_client_id;

  -- Crea la relazione coach-client con lo stato appropriato
  INSERT INTO coach_clients (
    coach_id,
    client_id,
    role,
    status
  )
  VALUES (
    v_coach_id,
    v_client_id,
    'primary',
    v_coach_client_status
  );

  RETURN v_client_id;
END;
$$;

-- 5. Aggiungere commento sulla colonna per documentare i valori validi
COMMENT ON COLUMN coach_clients.status IS 'Valori validi: invited, active, paused, terminated';