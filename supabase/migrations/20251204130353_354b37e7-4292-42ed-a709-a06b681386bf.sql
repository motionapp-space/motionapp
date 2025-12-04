-- =====================================================
-- FASE 1: Nuovi campi tabella events per CHANGE_PROPOSED
-- =====================================================

-- Aggiungi campi per gestire proposte di modifica dal coach
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS proposed_start_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS proposed_end_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS proposal_status text NULL;

-- Constraint per validare proposal_status
ALTER TABLE events
  ADD CONSTRAINT proposal_status_check
  CHECK (proposal_status IS NULL OR proposal_status IN ('pending', 'accepted', 'rejected'));

-- =====================================================
-- FASE 2: Trigger validazione UPDATE events lato client
-- =====================================================

-- Funzione che valida gli UPDATE sui propri eventi da parte dei clienti
CREATE OR REPLACE FUNCTION validate_client_event_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Se l'utente è il coach (owner), permetti tutto
  IF OLD.coach_id = auth.uid() THEN
    RETURN NEW;
  END IF;
  
  -- Se l'utente è il client, valida che non stia modificando campi non autorizzati
  -- Campi che il client NON può modificare
  IF NEW.coach_id IS DISTINCT FROM OLD.coach_id THEN
    RAISE EXCEPTION 'Client cannot modify coach_id';
  END IF;
  
  IF NEW.client_id IS DISTINCT FROM OLD.client_id THEN
    RAISE EXCEPTION 'Client cannot modify client_id';
  END IF;
  
  IF NEW.title IS DISTINCT FROM OLD.title THEN
    RAISE EXCEPTION 'Client cannot modify title';
  END IF;
  
  IF NEW.location IS DISTINCT FROM OLD.location THEN
    RAISE EXCEPTION 'Client cannot modify location';
  END IF;
  
  -- Se sta cambiando start_at o end_at, deve essere per accettare una proposta
  IF (NEW.start_at IS DISTINCT FROM OLD.start_at OR NEW.end_at IS DISTINCT FROM OLD.end_at) THEN
    IF OLD.proposal_status != 'pending' THEN
      RAISE EXCEPTION 'Client can only modify times when accepting a proposal';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Applica il trigger
DROP TRIGGER IF EXISTS validate_client_event_update_trigger ON events;
CREATE TRIGGER validate_client_event_update_trigger
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION validate_client_event_update();

-- =====================================================
-- FASE 3: RLS Policies per Client App
-- =====================================================

-- booking_settings: clienti possono vedere settings del proprio coach
CREATE POLICY "Clients can view booking settings of their coach"
ON booking_settings FOR SELECT
USING (
  coach_id IN (
    SELECT coach_id FROM clients WHERE auth_user_id = auth.uid()
  )
);

-- availability_windows: clienti possono vedere finestre del proprio coach
CREATE POLICY "Clients can view availability windows of their coach"
ON availability_windows FOR SELECT
USING (
  coach_id IN (
    SELECT coach_id FROM clients WHERE auth_user_id = auth.uid()
  )
);

-- booking_requests: clienti possono vedere le proprie richieste
CREATE POLICY "Clients can view their own booking requests"
ON booking_requests FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients WHERE auth_user_id = auth.uid()
  )
);

-- booking_requests: clienti possono creare richieste per se stessi
CREATE POLICY "Clients can create their own booking requests"
ON booking_requests FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE auth_user_id = auth.uid()
  )
);

-- booking_requests: clienti possono aggiornare SOLO per annullare (CANCELED_BY_CLIENT)
CREATE POLICY "Clients can cancel their own booking requests"
ON booking_requests FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM clients WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  status = 'CANCELED_BY_CLIENT'
);

-- events: clienti possono aggiornare i propri eventi (il trigger valida i campi)
CREATE POLICY "Clients can update their own events"
ON events FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM clients WHERE auth_user_id = auth.uid()
  )
);