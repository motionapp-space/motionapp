

# Evoluzione `client_plan_assignments` -- Implementazione transazionale

## Panoramica

Tre condizioni non negoziabili:
1. ASSIGN_PLAN in un'unica transazione DB (RPC Postgres)
2. `client_plans.status` frozen/legacy, non aggiornato dalla FSM
3. `client_plan_assignments.status` dichiarata unica source of truth

## Stato attuale della tabella `client_plan_assignments`

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid PK | |
| client_id | uuid FK -> clients | |
| plan_id | uuid FK -> **plans** (template!) | Va cambiato |
| assigned_at | timestamptz | |
| note | text | |

Mancano: `coach_id`, `status`, `ended_at`. La FK `plan_id` punta a `plans` (template), non a `client_plans`.

`plan_state_logs.from_status` e `to_status` usano l'enum `plan_status` (IN_CORSO/COMPLETATO/ELIMINATO) -- la logica di logging manterra una mappatura per backward compat.

---

## Modifiche

### 1. Migrazione SQL

Evoluzione schema + RPC transazionale + RLS.

**Schema evolution:**
```sql
ALTER TABLE client_plan_assignments
  ADD COLUMN coach_id uuid REFERENCES auth.users(id),
  ADD COLUMN status text NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN ended_at timestamptz;

ALTER TABLE client_plan_assignments
  DROP CONSTRAINT client_plan_assignments_plan_id_fkey;

ALTER TABLE client_plan_assignments
  ADD CONSTRAINT client_plan_assignments_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES client_plans(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX uq_active_assignment_per_coach_client
  ON client_plan_assignments (coach_id, client_id)
  WHERE status = 'ACTIVE';

CREATE INDEX idx_cpa_coach_id ON client_plan_assignments (coach_id);
CREATE INDEX idx_cpa_status_active ON client_plan_assignments (status) WHERE status = 'ACTIVE';
```

**RPC transazionale `fsm_assign_plan`:**

Questa funzione Postgres esegue tutte le operazioni in un'unica transazione. Se qualsiasi step fallisce, viene fatto rollback automatico.

```sql
CREATE OR REPLACE FUNCTION fsm_assign_plan(
  p_coach_id uuid,
  p_client_id uuid,
  p_coach_client_id uuid,
  p_plan_name text,
  p_plan_description text DEFAULT NULL,
  p_plan_data jsonb DEFAULT '{"days":[]}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_plan_id uuid;
  v_old_assignment RECORD;
BEGIN
  -- 1. Close existing ACTIVE assignments for this coach-client pair
  UPDATE client_plan_assignments
  SET status = 'COMPLETED', ended_at = now()
  WHERE coach_id = p_coach_id
    AND client_id = p_client_id
    AND status = 'ACTIVE'
  RETURNING id, plan_id INTO v_old_assignment;

  -- 2. Log old assignment closure (if any)
  IF v_old_assignment.id IS NOT NULL THEN
    INSERT INTO plan_state_logs (plan_id, client_id, from_status, to_status, cause, actor_type, actor_id)
    VALUES (v_old_assignment.plan_id, p_client_id, 'IN_CORSO', 'COMPLETATO', 'AUTO_COMPLETE_ON_NEW_PLAN', 'PT', p_coach_id);
  END IF;

  -- 3. Create client_plans record
  --    NOTE: client_plans.status is FROZEN at 'IN_CORSO' (legacy).
  --    Business lifecycle is managed ONLY by client_plan_assignments.status.
  INSERT INTO client_plans (coach_client_id, name, description, data, status, is_visible)
  VALUES (p_coach_client_id, p_plan_name, p_plan_description, p_plan_data, 'IN_CORSO', true)
  RETURNING id INTO v_new_plan_id;

  -- 4. Create new ACTIVE assignment (source of truth for plan lifecycle)
  INSERT INTO client_plan_assignments (coach_id, client_id, plan_id, status, assigned_at)
  VALUES (p_coach_id, p_client_id, v_new_plan_id, 'ACTIVE', now());

  -- 5. [COMPAT LAYER] Sync coach_clients.active_plan_id
  --    This is NOT the source of truth. It exists only for backward
  --    compatibility with existing queries and UI filters.
  UPDATE coach_clients
  SET active_plan_id = v_new_plan_id
  WHERE id = p_coach_client_id;

  -- 6. Log the new assignment
  INSERT INTO plan_state_logs (plan_id, client_id, from_status, to_status, cause, actor_type, actor_id)
  VALUES (v_new_plan_id, p_client_id, NULL, 'IN_CORSO', 'ASSIGN_PLAN', 'PT', p_coach_id);

  RETURN jsonb_build_object(
    'success', true,
    'plan_id', v_new_plan_id,
    'old_assignment_closed', v_old_assignment.id IS NOT NULL
  );
END;
$$;
```

**RLS aggiornamento** (coach_id diretto, piu efficiente):
```sql
DROP POLICY "Coaches can view assignments for their clients" ON client_plan_assignments;
CREATE POLICY "Coaches can view assignments" ON client_plan_assignments FOR SELECT
  USING (coach_id = auth.uid());

-- Analoga per INSERT, UPDATE, DELETE
```

### 2. Edge function `client-fsm/index.ts`

Riscrittura completa della logica FSM.

**Tipi:**
- Rimuovere `type PlanStatus` (legacy)
- Aggiungere `type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'DELETED' | 'PAUSED'`
- Documentare nel commento: `client_plan_assignments.status` e l'unica source of truth

**`assignPlan`:**
- Rimuovere tutta la logica attuale (query IN_CORSO, loop auto-complete, insert, update coach_clients)
- Sostituire con una singola chiamata RPC: `supabase.rpc('fsm_assign_plan', { ... })`
- Nessun update parziale possibile: la transazione e atomica

**`deletePlan`:**
- Validazione: verificare assignment ACTIVE tramite `client_plan_assignments` (non piu `client_plans.status`)
- Aggiornare `client_plans`: solo `deleted_at` e `is_visible = false` (NON toccare `status`)
- Chiudere assignment: `UPDATE client_plan_assignments SET status = 'DELETED', ended_at = now()`
- [COMPAT] `coach_clients.active_plan_id = null`

**`completePlan`:**
- Validazione tramite assignment
- Aggiornare `client_plans`: solo `locked_at` e `completed_at` (NON toccare `status`)
- Chiudere assignment: `UPDATE client_plan_assignments SET status = 'COMPLETED', ended_at = now()`
- [COMPAT] `coach_clients.active_plan_id = null`

**`archiveClient`:**
- Rimuovere logica di auto-complete su `client_plans.status`
- Chiudere assignment ACTIVE: `UPDATE client_plan_assignments SET status = 'COMPLETED', ended_at = now() WHERE coach_id AND client_id AND status = 'ACTIVE'`
- `coach_clients.status = 'archived', active_plan_id = null`

**Log:**
- `logPlanTransition` continua a scrivere su `plan_state_logs` usando i valori enum legacy (IN_CORSO/COMPLETATO/ELIMINATO) per backward compat con la colonna `plan_status`

### 3. Tipi TypeScript

In `src/features/client-plans/types.ts`, aggiungere:

```typescript
// ============================================================
// client_plan_assignments.status is the SOLE source of truth
// for the plan lifecycle. client_plans.status is legacy/frozen.
// ============================================================
export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'DELETED' | 'PAUSED';

export interface ClientPlanAssignment {
  id: string;
  coach_id: string;
  client_id: string;
  plan_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  ended_at?: string;
  note?: string;
}
```

Nessun tipo esistente viene rimosso.

---

## Flusso finale ASSIGN_PLAN

```text
Edge Function riceve ASSIGN_PLAN
  |
  +--> Validazione (auth, coach-client, archived check)
  |
  +--> supabase.rpc('fsm_assign_plan', {...})
  |      |
  |      +--> [TX] Close ACTIVE assignments
  |      +--> [TX] Log old closure
  |      +--> [TX] Create client_plans (status='IN_CORSO' FROZEN)
  |      +--> [TX] Create client_plan_assignments (status='ACTIVE')
  |      +--> [TX] Sync coach_clients.active_plan_id (compat)
  |      +--> [TX] Log new assignment
  |      |
  |      +--> COMMIT (atomico) o ROLLBACK (tutto annullato)
  |
  RETURN { success, plan_id }
```

---

## File da modificare

| File | Modifica |
|------|----------|
| Migrazione SQL | Schema evolution + RPC `fsm_assign_plan` + RLS |
| `supabase/functions/client-fsm/index.ts` | Riscrittura: RPC per ASSIGN, assignment per DELETE/COMPLETE/ARCHIVE |
| `src/features/client-plans/types.ts` | Aggiunta `AssignmentStatus` + `ClientPlanAssignment` |

## Garanzie

- ASSIGN_PLAN e atomico (RPC Postgres, singola transazione)
- `client_plans.status` non viene mai aggiornato dalla FSM (frozen, commentato)
- `client_plan_assignments.status` e dichiarata source of truth nel codice
- Vincolo unique partial: un solo ACTIVE per coppia coach-client
- `coach_clients.active_plan_id` e compat layer documentato
- Nessuna modifica alle API di lettura frontend
- Nessuna regressione: filtri su `status = 'IN_CORSO'` continuano a funzionare (valore iniziale frozen)

