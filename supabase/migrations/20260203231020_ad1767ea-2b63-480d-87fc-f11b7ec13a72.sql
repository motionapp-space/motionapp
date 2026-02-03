-- Indice univoco parziale: massimo UN single_session per coach
-- Non blocca multipli session_pack (pacchetti)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_coach_single_session 
ON products (coach_id) 
WHERE type = 'single_session';

-- Commento per documentazione
COMMENT ON INDEX idx_products_coach_single_session IS 
  'Garantisce un solo prodotto single_session per coach';