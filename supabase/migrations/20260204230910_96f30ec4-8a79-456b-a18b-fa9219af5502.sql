-- =========================================
-- REFACTOR: Stati Cliente - Parte finale
-- Step finale: Drop colonne obsolete da clients
-- =========================================

-- Step 1: Ricreare la view senza le colonne obsolete
DROP VIEW IF EXISTS v_coach_client_details;

CREATE VIEW v_coach_client_details AS
SELECT 
    cc.id AS coach_client_id,
    cc.coach_id,
    cc.client_id,
    cc.status AS relationship_status,
    c.first_name,
    c.last_name,
    c.email,
    c.phone
FROM coach_clients cc
JOIN clients c ON c.id = cc.client_id;

-- Step 2: Elimina la colonna archived_at (ora su coach_clients.status)
ALTER TABLE clients DROP COLUMN IF EXISTS archived_at;

-- Step 3: Elimina la colonna status (non più utilizzata)
ALTER TABLE clients DROP COLUMN IF EXISTS status;