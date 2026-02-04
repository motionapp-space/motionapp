
# Piano Refactor: Stati Cliente / Invito / Piani — Beta Minimal, Relazione-centrica

## Riepilogo Esecutivo

Questo refactor sposta l'unica fonte di verità per lo stato del cliente dalla tabella `clients` alla relazione `coach_clients`, eliminando completamente `clients.status` e `clients.archived_at`, e rimuovendo il valore `invited` da `coach_clients.status`.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                         MODELLO FINALE                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   clients                                                                  │
│   └── NESSUNO STATO (solo dati anagrafici + user_id + last_access_at)     │
│                                                                            │
│   coach_clients.status                                                     │
│   └── 'active' | 'blocked' | 'archived'   ← UNICA FONTE DI VERITÀ         │
│                                                                            │
│   client_invites.status                                                    │
│   └── 'pending' | 'accepted' | 'expired' | 'revoked'   ← SEPARATO         │
│                                                                            │
│   client_plans.status                                                      │
│   └── 'IN_CORSO' | 'COMPLETATO' | 'ELIMINATO'   ← DOMINIO PIANI           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Parte A — Database (Migrazioni Obbligatorie)

### A1) Backfill: Spostare archivio da clients a coach_clients

Prima di eliminare le colonne, migriamo i dati di archiviazione sulla relazione.

```sql
-- Step 1: Backfill coach_clients.status = 'archived' per clienti con archived_at
UPDATE coach_clients cc
SET status = 'archived'
FROM clients c
WHERE cc.client_id = c.id
  AND c.archived_at IS NOT NULL
  AND cc.status != 'archived';
```

### A2) Normalizzare coach_clients.status: Eliminare 'invited'

Tutti i record con `status = 'invited'` vengono portati ad `active`. L'invito è tracciato esclusivamente in `client_invites`.

```sql
-- Step 2: Converti 'invited' → 'active'
UPDATE coach_clients
SET status = 'active'
WHERE status = 'invited';

-- Step 3: Rimuovi constraint esistente
ALTER TABLE coach_clients 
DROP CONSTRAINT IF EXISTS coach_clients_status_check;

-- Step 4: Nuovo constraint con soli 3 valori
ALTER TABLE coach_clients
ADD CONSTRAINT coach_clients_status_check
CHECK (status IN ('active', 'blocked', 'archived'));
```

### A3) Eliminare colonne obsolete da clients

```sql
-- Step 5: Elimina archived_at
ALTER TABLE clients DROP COLUMN IF EXISTS archived_at;

-- Step 6: Elimina status (e l'ENUM associato)
ALTER TABLE clients DROP COLUMN IF EXISTS status;

-- Step 7: Elimina ENUM client_status (se non usato altrove)
DROP TYPE IF EXISTS client_status;
```

### A4) Indici ottimizzati

```sql
-- Indice per lista clienti attivi (default query)
CREATE INDEX IF NOT EXISTS idx_coach_clients_active
ON coach_clients (coach_id)
WHERE status IN ('active', 'blocked');

-- Indice per toggle archiviati (pochi record)
CREATE INDEX IF NOT EXISTS idx_coach_clients_archived
ON coach_clients (coach_id)
WHERE status = 'archived';
```

### A5) Aggiornare RPC `create_client_with_coach_link`

La RPC deve:
- NON scrivere `clients.status` (colonna eliminata)
- Impostare sempre `coach_clients.status = 'active'`
- L'invito viene gestito separatamente in `client_invites`

```sql
CREATE OR REPLACE FUNCTION public.create_client_with_coach_link(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL,
  p_sex sex DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_fiscal_code TEXT DEFAULT NULL,
  p_with_invite BOOLEAN DEFAULT false  -- parametro mantenuto per compatibilità API
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
  -- Crea il cliente SENZA status (colonna eliminata)
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
```

### A6) Aggiornare RPC `get_coach_onboarding_data`

La RPC deve usare `coach_clients.status` invece di `clients.archived_at`.

```sql
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
```

---

## Parte B — Backend / Edge Functions

### B1) Refactor `client-fsm` (supabase/functions/client-fsm/index.ts)

**Cambiamenti fondamentali:**
- Rimuovere tutti i riferimenti a `clients.status` e `clients.archived_at`
- ARCHIVE/UNARCHIVE operano su `coach_clients.status`
- Azioni piano NON toccano la relazione

**Azioni consentite (modificano coach_clients):**

| Azione | Operazione |
|--------|------------|
| `ARCHIVE_CLIENT` | `coach_clients.status = 'archived'`, `clients.active_plan_id = null` |
| `UNARCHIVE_CLIENT` | `coach_clients.status = 'active'`, `clients.active_plan_id = null` |

**Azioni che NON toccano coach_clients né clients.status:**

| Azione | Operazione |
|--------|------------|
| `ASSIGN_PLAN` | Solo `client_plans` + `clients.active_plan_id` |
| `COMPLETE_PLAN` | Solo `client_plans` + `clients.active_plan_id = null` |
| `DELETE_PLAN` | Solo `client_plans` + `clients.active_plan_id = null` |
| `CLIENT_LOGS_IN` | Solo `clients.last_access_at` |
| `NO_ACCESS_X_DAYS` | **ELIMINARE COMPLETAMENTE** |

**Codice modificato:**

```typescript
// Tipo ClientStatus - DA ELIMINARE
// type ClientStatus = 'POTENZIALE' | 'ATTIVO' | 'INATTIVO' | 'ARCHIVIATO';

// archiveClient() - NUOVO
async function archiveClient(supabase: any, client: any, userId: string) {
  const coachClientId = client.coach_client_id;
  
  // Verifica se già archiviato
  const { data: cc } = await supabase
    .from('coach_clients')
    .select('status')
    .eq('id', coachClientId)
    .single();
    
  if (cc?.status === 'archived') {
    return { success: true, message: 'Already archived' };
  }

  // Auto-complete piano attivo (se presente)
  if (client.active_plan_id) {
    const { data: activePlan } = await supabase
      .from('client_plans')
      .select('*')
      .eq('id', client.active_plan_id)
      .single();

    if (activePlan && activePlan.status === 'IN_CORSO') {
      await supabase
        .from('client_plans')
        .update({
          status: 'COMPLETATO',
          locked_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq('id', activePlan.id);

      await logPlanTransition(supabase, activePlan.id, client.id, 'IN_CORSO', 'COMPLETATO', 'AUTO_COMPLETE_ON_ARCHIVE', userId);
    }
  }

  // Aggiorna SOLO coach_clients (non clients.status)
  const { error: ccError } = await supabase
    .from('coach_clients')
    .update({ status: 'archived' })
    .eq('id', coachClientId);

  if (ccError) throw ccError;

  // Pulisci active_plan_id su clients (ma NON status)
  await supabase
    .from('clients')
    .update({ active_plan_id: null })
    .eq('id', client.id);

  return { success: true };
}

// unarchiveClient() - NUOVO
async function unarchiveClient(supabase: any, client: any, userId: string) {
  const coachClientId = client.coach_client_id;
  
  const { data: cc } = await supabase
    .from('coach_clients')
    .select('status')
    .eq('id', coachClientId)
    .single();
    
  if (cc?.status !== 'archived') {
    throw new Error('Client is not archived');
  }

  // Aggiorna SOLO coach_clients
  const { error } = await supabase
    .from('coach_clients')
    .update({ status: 'active' })
    .eq('id', coachClientId);

  if (error) throw error;

  // Pulisci active_plan_id
  await supabase
    .from('clients')
    .update({ active_plan_id: null })
    .eq('id', client.id);

  return { success: true };
}

// assignPlan() - MODIFICATO (nessun side-effect su status)
async function assignPlan(supabase: any, client: any, userId: string, metadata: any) {
  const coachClientId = client.coach_client_id;
  
  // Verifica che non sia archiviato
  const { data: cc } = await supabase
    .from('coach_clients')
    .select('status')
    .eq('id', coachClientId)
    .single();
    
  if (cc?.status === 'archived') {
    throw new Error('Cannot assign plan to archived client');
  }

  // ... logica esistente per auto-complete piani ...
  
  // Crea nuovo piano
  const { data: newPlan, error: planError } = await supabase
    .from('client_plans')
    .insert({
      coach_client_id: coachClientId,
      name: metadata?.name || 'New Plan',
      description: metadata?.description,
      data: metadata?.data || { days: [] },
      status: 'IN_CORSO',
      is_visible: true,
    })
    .select()
    .single();

  if (planError) throw planError;

  // Aggiorna SOLO active_plan_id, NON status
  await supabase
    .from('clients')
    .update({ active_plan_id: newPlan.id })
    .eq('id', client.id);

  return { success: true, plan: newPlan };
}

// deletePlan() / completePlan() - MODIFICATI
// Aggiornano solo client_plans + clients.active_plan_id
// NON toccano clients.status né coach_clients.status

// markInactive() - ELIMINARE COMPLETAMENTE
// clientLogsIn() - Solo update last_access_at
async function clientLogsIn(supabase: any, client: any) {
  await supabase
    .from('clients')
    .update({ last_access_at: new Date().toISOString() })
    .eq('id', client.id);
  return { success: true, message: 'Last access updated' };
}
```

### B2) Refactor `accept-invite` (supabase/functions/accept-invite/index.ts)

```typescript
// PRIMA (linea 209-225):
await supabaseAdmin.from('clients').update({
  user_id: authUserId,
  status: 'ATTIVO',                    // ← ELIMINARE
  last_access_at: new Date().toISOString(),
}).eq('id', invite.client_id);

await supabaseAdmin.from('coach_clients')
  .update({ status: 'active' })        // ← ELIMINARE (già active)
  .eq('client_id', invite.client_id);

// DOPO:
await supabaseAdmin.from('clients').update({
  user_id: authUserId,
  last_access_at: new Date().toISOString(),
}).eq('id', invite.client_id);

// Nessun update a coach_clients - già 'active' dalla creazione
```

---

## Parte C — Frontend

### C1) Lista Clienti (src/features/clients/api/clients.api.ts)

**Query principale:** Filtra per `coach_clients.status` invece di `clients.archived_at`.

```typescript
// PRIMA:
const { data: coachClients, error: ccError } = await supabase
  .from("coach_clients")
  .select("client_id")
  .eq("coach_id", user.id)
  .in("status", ["active", "invited"]);  // ← 'invited' da rimuovere

// Archive filter
if (!includeArchived) {
  query = query.is("archived_at", null);  // ← su clients
}

// DOPO:
const statusFilter = includeArchived 
  ? ["active", "blocked", "archived"]
  : ["active", "blocked"];

const { data: coachClients, error: ccError } = await supabase
  .from("coach_clients")
  .select("client_id, status")
  .eq("coach_id", user.id)
  .in("status", statusFilter);

// Nessun filtro su clients.archived_at (colonna eliminata)
```

### C2) ClientsTable.tsx - Determinare archived da coach_clients

Attualmente usa `client.archived_at !== null`. Deve usare un campo derivato dalla relazione.

```typescript
// Opzione 1: Aggiungere isArchived ai dati restituiti dalla query
interface ClientWithDetails {
  // ... campi esistenti ...
  isArchived?: boolean;  // Derivato da coach_clients.status
}

// In listClients(), dopo il fetch:
const clientIdsArchived = new Set(
  coachClients?.filter(cc => cc.status === 'archived').map(cc => cc.client_id) || []
);

// Nel mapping:
return {
  ...client,
  isArchived: clientIdsArchived.has(client.id),
  // ...
};

// In ClientsTable.tsx:
{client.isArchived ? (
  <IconTooltipButton onClick={() => onUnarchive(...)}><RotateCcw /></IconTooltipButton>
) : (
  <IconTooltipButton onClick={() => onArchive(...)}><Archive /></IconTooltipButton>
)}
```

### C3) Dashboard Stats (src/features/dashboard/hooks/useDashboardStats.ts)

**Sostituire filtri basati su `clients.status`:**

```typescript
// PRIMA:
const activeClients = clients.filter(c => c.status === "ATTIVO").length;
const terminatedClients = clients.filter(c => c.status === "INATTIVO" || c.status === "ARCHIVIATO").length;

// DOPO:
// Query coach_clients per determinare stato archivio
const { data: ccData } = await supabase
  .from("coach_clients")
  .select("client_id, status")
  .eq("coach_id", user.id);

const archivedClientIds = new Set(
  ccData?.filter(cc => cc.status === 'archived').map(cc => cc.client_id) || []
);

const nonArchivedClients = clients.filter(c => !archivedClientIds.has(c.id)).length;
const archivedClients = clients.filter(c => archivedClientIds.has(c.id)).length;

// Ritorno con naming corretto:
return {
  nonArchivedClients,      // Rinominato da activeClients
  nonArchivedClientsChange,
  archivedClients,         // Rinominato da terminatedClients
  archivedClientsChange,
  // ...
};
```

### C4) Types - Eliminare ClientStatus

```typescript
// src/types/client.ts e src/features/clients/types.ts

// ELIMINARE COMPLETAMENTE:
// export type ClientStatus = "INVITATO" | "POTENZIALE" | "ATTIVO" | "INATTIVO" | "ARCHIVIATO";

// ELIMINARE da interface Client:
// status: ClientStatus;
// archived_at?: string;

// AGGIUNGERE a ClientWithDetails:
export interface ClientWithDetails extends ClientWithTags {
  // ... campi esistenti ...
  isArchived?: boolean;  // Derivato da coach_clients.status
}
```

### C5) Hook useOnboardingState (già corretto post-migrazione RPC)

Dopo l'aggiornamento della RPC `get_coach_onboarding_data`, l'hook funziona senza modifiche.

---

## Parte D — RLS (Verifiche)

### Principio

Le policy RLS non devono riferirsi a `clients.status` o `clients.archived_at`.

**Verifica policy esistenti:**

```sql
-- Controllare che nessuna policy usi clients.status
SELECT policyname, tablename, qual, with_check 
FROM pg_policies 
WHERE qual LIKE '%clients.status%' 
   OR with_check LIKE '%clients.status%'
   OR qual LIKE '%archived_at%'
   OR with_check LIKE '%archived_at%';
```

**Policy corrette (esempio):**

```sql
-- Coaches can view their own clients
USING (
  EXISTS (
    SELECT 1
    FROM coach_clients cc
    WHERE cc.client_id = clients.id
      AND cc.coach_id = auth.uid()
  )
)

-- Per operazioni write su clienti non archiviati:
USING (
  EXISTS (
    SELECT 1
    FROM coach_clients cc
    WHERE cc.client_id = clients.id
      AND cc.coach_id = auth.uid()
      AND cc.status IN ('active', 'blocked')
  )
)
```

---

## Parte E — Test Automatici (Obbligatori)

### E1) Test E2E (Playwright)

File: `e2e/clients-refactor.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Client Status Refactor - Relazione-centrica', () => {
  
  test('E1: Cliente invitato visibile immediatamente in lista', async ({ page }) => {
    // Login coach
    // Crea cliente con invito
    // Verifica cliente in lista (coach_clients.status = 'active')
    // Verifica stato invito in client_invites = 'pending'
  });

  test('E2: Toggle archiviati basato su coach_clients.status', async ({ page }) => {
    // Verifica toggle NON presente se nessun coach_clients.status = 'archived'
    // Archivia cliente → coach_clients.status = 'archived'
    // Toggle appare
    // Default: cliente archiviato NON visibile
    // Toggle ON: cliente archiviato visibile
  });

  test('E3: Piano NON modifica coach_clients.status', async ({ page }) => {
    // Crea cliente
    // Verifica coach_clients.status = 'active'
    // Assegna piano
    // Verifica coach_clients.status = 'active' (invariato)
    // Completa piano
    // Verifica coach_clients.status = 'active' (invariato)
    // Elimina piano
    // Verifica coach_clients.status = 'active' (invariato)
  });

  test('E4: Stato invito solo in Tab Profilo', async ({ page }) => {
    // Crea cliente con invito
    // Lista clienti: nessun badge invito
    // Dettaglio → Profilo: badge invito presente
    // Altre tab: nessun badge invito
  });

  test('E5: Archiviazione non altera client_invites', async ({ page }) => {
    // Cliente con invito pending
    // Archivia cliente
    // client_invites.status resta 'pending'
  });

  test('E6: Cliente archiviato accessibile via URL diretto', async ({ page }) => {
    // Archivia cliente
    // Naviga a /clients/:id
    // Pagina si apre (non 404)
    // Banner "Cliente archiviato" presente
  });

  test('E7: Resend invite non cambia coach_clients.status', async ({ page }) => {
    // Cliente con invito expired
    // Resend invite
    // coach_clients.status resta 'active'
  });
});
```

### E2) Test Integrazione (Vitest)

File: `src/features/clients/__tests__/no-status-sideeffect.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('No status side-effects', () => {
  it('ASSIGN_PLAN should not update coach_clients.status', async () => {
    // Mock/spy supabase
    // Invoke ASSIGN_PLAN
    // Assert: nessun update a coach_clients.status
  });

  it('COMPLETE_PLAN should not update coach_clients.status', async () => {
    // Simile
  });

  it('DELETE_PLAN should not update coach_clients.status', async () => {
    // Simile
  });
  
  it('accept-invite should not update clients.status', async () => {
    // Mock accept-invite flow
    // Assert: nessun update a clients (solo user_id e last_access_at)
  });
});
```

### E3) Aggiornare test esistenti

File: `src/features/clients/__tests__/client-fsm.test.ts`

```typescript
// RIMUOVERE tutti gli assert su clients.status:
// expect(client.status).toBe('ATTIVO');      // ← ELIMINARE
// expect(client.status).toBe('POTENZIALE');  // ← ELIMINARE

// AGGIUNGERE assert su coach_clients.status:
const { data: cc } = await supabase
  .from('coach_clients')
  .select('status')
  .eq('client_id', clientId)
  .single();
expect(cc.status).toBe('archived');  // o 'active'
```

---

## Parte F — Guardrail CI

### Grep Check (blocca build)

```bash
#!/bin/bash
# .github/workflows/lint-status.sh

set -e

echo "Checking for forbidden status references..."

# Pattern vietati
PATTERNS=(
  "clients.status"
  "clients.archived_at"
  "coach_clients.status.*invited"
  "status: 'ATTIVO'"
  "status: 'POTENZIALE'"
  "status: 'INATTIVO'"
  "status: 'ARCHIVIATO'"
  "status: 'INVITATO'"
  "status: 'invited'"
)

for pattern in "${PATTERNS[@]}"; do
  if grep -r "$pattern" \
    --include="*.ts" --include="*.tsx" --include="*.sql" \
    --exclude-dir="node_modules" \
    --exclude-dir=".git" \
    --exclude="*migration*" \
    --exclude="*test*" \
    src/ supabase/functions/; then
    echo "ERROR: Found forbidden pattern: $pattern"
    exit 1
  fi
done

echo "All checks passed!"
```

---

## Riepilogo File da Modificare

| File | Azione |
|------|--------|
| **Migrazione SQL** | Backfill + constraint + drop colonne + indici |
| **Migrazione SQL** | Aggiornare RPC `create_client_with_coach_link` |
| **Migrazione SQL** | Aggiornare RPC `get_coach_onboarding_data` |
| `supabase/functions/client-fsm/index.ts` | Refactor completo (coach_clients come target) |
| `supabase/functions/accept-invite/index.ts` | Rimuovere update status |
| `src/features/clients/api/clients.api.ts` | Filtri su coach_clients.status |
| `src/features/dashboard/hooks/useDashboardStats.ts` | Logica basata su coach_clients |
| `src/features/clients/components/ClientsTable.tsx` | Usare `isArchived` |
| `src/types/client.ts` | Eliminare `ClientStatus`, `archived_at` |
| `src/features/clients/types.ts` | Eliminare `ClientStatus`, aggiungere `isArchived` |
| `src/features/clients/__tests__/client-fsm.test.ts` | Aggiornare assert |
| **Nuovo**: `e2e/clients-refactor.spec.ts` | Test E2E |
| **Nuovo**: `.github/workflows/lint-status.sh` | Guardrail CI |

---

## Ordine di Esecuzione

1. **Migrazione DB Step 1**: Backfill `coach_clients.status = 'archived'` da `clients.archived_at`
2. **Migrazione DB Step 2**: Convertire `invited` → `active` + nuovo constraint
3. **Migrazione DB Step 3**: Aggiornare RPC `create_client_with_coach_link`
4. **Migrazione DB Step 4**: Aggiornare RPC `get_coach_onboarding_data`
5. **Edge Functions**: Deploy `client-fsm` refactored + `accept-invite`
6. **Frontend**: Update API, hooks, components, types
7. **Migrazione DB Step 5**: Drop `clients.archived_at` e `clients.status`
8. **Test**: Aggiornare esistenti + creare E2E + guardrail CI
9. **Verifica finale + Deploy**

---

## Non-Goals (Vietati)

- ❌ Reintrodurre stati cliente su `clients` table
- ❌ Collegare piani a stato cliente o relazione
- ❌ Usare `invited` in `coach_clients`
- ❌ Mostrare stato invito fuori da Tab Profilo
- ❌ Cambiare UX toggle archiviati
- ❌ Introdurre nuovi stati oltre `active | blocked | archived`
