-- =========================================
-- REFACTOR: Stati Cliente - Relazione-centrica
-- Step 1-4: Backfill + Normalize + RPCs
-- =========================================

-- Step 1: Backfill coach_clients.status = 'archived' per clienti con archived_at
UPDATE coach_clients cc
SET status = 'archived'
FROM clients c
WHERE cc.client_id = c.id
  AND c.archived_at IS NOT NULL
  AND cc.status != 'archived';

-- Step 2: Converti 'invited' → 'active' (invito ora tracciato solo in client_invites)
UPDATE coach_clients
SET status = 'active'
WHERE status = 'invited';

-- Step 3: Rimuovi constraint esistente
ALTER TABLE coach_clients 
DROP CONSTRAINT IF EXISTS coach_clients_status_check;

-- Step 4: Nuovo constraint con soli 3 valori: active, blocked, archived
ALTER TABLE coach_clients
ADD CONSTRAINT coach_clients_status_check
CHECK (status IN ('active', 'blocked', 'archived'));

-- Step 5: Indici ottimizzati
-- Indice per lista clienti attivi (default query)
CREATE INDEX IF NOT EXISTS idx_coach_clients_active
ON coach_clients (coach_id)
WHERE status IN ('active', 'blocked');

-- Indice per toggle archiviati (pochi record)
CREATE INDEX IF NOT EXISTS idx_coach_clients_archived
ON coach_clients (coach_id)
WHERE status = 'archived';

-- Step 6: Aggiornare RPC create_client_with_coach_link
-- NON scrive clients.status, imposta sempre coach_clients.status = 'active'
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
BEGIN
  -- Crea il cliente SENZA status (colonna da eliminare)
  -- Usiamo il default del DB per status temporaneamente fino alla drop
  INSERT INTO clients (
    first_name,
    last_name,
    email,
    phone,
    birth_date,
    sex,
    notes,
    fiscal_code
  )
  VALUES (
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_birth_date,
    p_sex,
    p_notes,
    p_fiscal_code
  )
  RETURNING id INTO v_client_id;

  -- Crea la relazione coach-client SEMPRE con status='active'
  -- L'invito è gestito separatamente in client_invites
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
    'active'  -- SEMPRE active, mai invited
  );

  RETURN v_client_id;
END;
$$;

-- Step 7: Aggiornare RPC get_coach_onboarding_data
-- Usa coach_clients.status invece di clients.archived_at
CREATE OR REPLACE FUNCTION public.get_coach_onboarding_data(p_coach_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  IF p_coach_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  WITH coach_client_rel AS (
    SELECT id AS coach_client_id, client_id, status
    FROM coach_clients
    WHERE coach_id = p_coach_id
  ),
  has_active AS (
    SELECT EXISTS (
      SELECT 1
      FROM coach_client_rel
      WHERE status IN ('active', 'blocked')
    ) AS val
  ),
  has_archived AS (
    SELECT EXISTS (
      SELECT 1
      FROM coach_client_rel
      WHERE status = 'archived'
    ) AS val
  ),
  has_plan AS (
    SELECT EXISTS (
      SELECT 1
      FROM client_plans cp
      INNER JOIN coach_client_rel cc ON cp.coach_client_id = cc.coach_client_id
      WHERE cp.status = 'IN_CORSO'
        AND cp.deleted_at IS NULL
    ) AS val
  ),
  has_event AS (
    SELECT EXISTS (
      SELECT 1
      FROM events e
      INNER JOIN coach_client_rel cc ON e.coach_client_id = cc.coach_client_id
    ) AS val
  )
  SELECT json_build_object(
    'has_active_clients', (SELECT val FROM has_active),
    'has_archived_clients', (SELECT val FROM has_archived),
    'has_any_plan', (SELECT val FROM has_plan),
    'has_any_appointment', (SELECT val FROM has_event)
  ) INTO v_result;

  RETURN v_result;
END;
$$;