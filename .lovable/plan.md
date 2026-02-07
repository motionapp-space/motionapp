
# Migrazione letture da `active_plan_id` a `client_plan_assignments`

## Panoramica

Migrare tutte le letture applicative da `clients.active_plan_id` e `coach_clients.active_plan_id` verso `client_plan_assignments` (source of truth). Creare una RPC transazionale `set_active_plan_v2` per le scritture. Nessuna modifica ai componenti UI.

---

## 1. Migrazione SQL

### 1a. RLS: lettura client su `client_plan_assignments`

Attualmente solo i coach possono leggere le assignment. Serve una policy per il client finale:

```sql
CREATE POLICY "Clients can view own assignments"
  ON client_plan_assignments FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );
```

### 1b. RPC `set_active_plan_v2`

Sostituisce `set_active_plan`. Transazionale, opera su `client_plan_assignments`:

```sql
CREATE OR REPLACE FUNCTION set_active_plan_v2(
  p_coach_client_id uuid,
  p_plan_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_coach_id uuid;
  v_client_id uuid;
BEGIN
  -- Auth
  SELECT coach_id, client_id INTO v_coach_id, v_client_id
  FROM coach_clients WHERE id = p_coach_client_id;
  IF v_coach_id IS NULL OR v_coach_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Close existing ACTIVE assignment
  UPDATE client_plan_assignments
  SET status = 'COMPLETED', ended_at = now()
  WHERE coach_id = v_coach_id AND client_id = v_client_id AND status = 'ACTIVE';

  -- If setting a new active plan
  IF p_plan_id IS NOT NULL THEN
    -- Validate plan ownership and not deleted
    IF NOT EXISTS (
      SELECT 1 FROM client_plans
      WHERE id = p_plan_id AND coach_client_id = p_coach_client_id AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Plan not found or deleted';
    END IF;

    -- Create new ACTIVE assignment
    INSERT INTO client_plan_assignments (coach_id, client_id, plan_id, status, assigned_at)
    VALUES (v_coach_id, v_client_id, p_plan_id, 'ACTIVE', now());

    -- Update in_use_at on plan
    UPDATE client_plans SET in_use_at = now() WHERE id = p_plan_id;
  END IF;

  -- [COMPAT LAYER] Sync coach_clients.active_plan_id
  UPDATE coach_clients
  SET active_plan_id = p_plan_id, updated_at = now()
  WHERE id = p_coach_client_id;

  RETURN jsonb_build_object('success', true, 'plan_id', p_plan_id);
END;
$$;
```

---

## 2. File da modificare (3 API + 1 hook + 2 tipi)

### 2.1 `src/features/client-workouts/api/client-plans.api.ts` (lettura client)

**Prima:**
```typescript
// 2 query: coach_clients.active_plan_id -> client_plans
const { data: cc } = await supabase
  .from("coach_clients").select("active_plan_id").eq("id", coachClientId).single();
if (!cc?.active_plan_id) return null;
const { data } = await supabase
  .from("client_plans").select("...").eq("id", cc.active_plan_id);
```

**Dopo:**
```typescript
// Query diretta su client_plan_assignments (source of truth)
const { data: assignment } = await supabase
  .from("client_plan_assignments")
  .select("plan_id")
  .eq("client_id", clientId)
  .eq("status", "ACTIVE")
  .maybeSingle();

if (!assignment) return null;

const { data } = await supabase
  .from("client_plans")
  .select("id, name, data, status, is_in_use")
  .eq("id", assignment.plan_id)
  .is("deleted_at", null)
  .maybeSingle();
```

Nota: questa funzione ha bisogno del `clientId` (non `coachClientId`). `getClientCoachClientId()` gia restituisce `clientId`, quindi e disponibile.

### 2.2 `src/features/client-plans/api/client-plans.api.ts` — `getClientPlansWithActive()`

**Prima:**
```typescript
const { data: cc } = await supabase
  .from("coach_clients").select("active_plan_id").eq("id", coachClientId).single();
const activePlanId = cc?.active_plan_id;
// ...
isActiveForClient: plan.id === activePlanId,
```

**Dopo:**
```typescript
// Source of truth: client_plan_assignments
const { data: activeAssignment } = await supabase
  .from("client_plan_assignments")
  .select("plan_id")
  .eq("coach_id", user.id)  // coach-scoped
  .eq("client_id", clientId)
  .eq("status", "ACTIVE")
  .maybeSingle();

const activePlanId = activeAssignment?.plan_id ?? null;
// ... rest unchanged
isActiveForClient: plan.id === activePlanId,
```

Nota: serve il `clientId` oltre al `coachClientId`. Si ottiene con una query aggiuntiva su `coach_clients` (gia disponibile) oppure si puo passare dalla firma della funzione (gia riceve `clientId`).

### 2.3 `src/features/client-plans/api/client-plans.api.ts` — `saveClientPlanAsTemplate()` (righe 218-223)

**Prima:**
```typescript
const { data: clientPlan } = await supabase
  .from("client_plans").select("*")
  .eq("coach_client_id", plan.coach_client_id)
  .eq("status", "IN_CORSO").single();
```

**Dopo:**
```typescript
// Source of truth: client_plan_assignments
const { data: activeAssignment } = await supabase
  .from("client_plan_assignments")
  .select("plan_id")
  .eq("client_id", cc.client_id)
  .eq("status", "ACTIVE")
  .maybeSingle();

if (activeAssignment) {
  await supabase.from("client_plans")
    .update({ derived_from_template_id: newTemplate.id })
    .eq("id", activeAssignment.plan_id);
}
```

### 2.4 `src/features/clients/api/clients.api.ts` — `listClients()`

Tre punti da migrare:

**a) Riga 69 — Join per nome piano:**

Prima: `current_plan:client_plans!active_plan_id(name)`

Dopo: rimuovere la join dalla query principale. Aggiungere una query batch dopo il fetch dei clienti:

```typescript
// Batch fetch active plan names via client_plan_assignments
const { data: activeAssignments } = await supabase
  .from("client_plan_assignments")
  .select("client_id, plan_id, client_plans!inner(name)")
  .in("client_id", batchClientIds)
  .eq("status", "ACTIVE");

// Build map: client_id -> plan_name
const activePlanMap = new Map(
  (activeAssignments || []).map(a => [a.client_id, a.client_plans?.name])
);
```

Poi nel mapping: `current_plan_name: activePlanMap.get(client.id) ?? undefined`

**b) Righe 83-89 — Filtro `withActivePlan`:**

Prima: `query.not("active_plan_id", "is", null)` / `query.is("active_plan_id", null)`

Dopo: filtro client-side basato sulla `activePlanMap`:

```typescript
if (withActivePlan !== undefined) {
  items = items.filter(c => {
    const hasActive = activePlanMap.has(c.id);
    return withActivePlan ? hasActive : !hasActive;
  });
}
```

**c) Riga 334 — Strip `active_plan_id` in `updateClient`:**

Rimane invariato (protezione difensiva, non e una lettura).

### 2.5 `src/features/client-plans/hooks/useSetActivePlan.ts`

**Prima:**
```typescript
const { data, error } = await supabase.rpc('set_active_plan', {
  p_coach_client_id: coachClientId,
  p_plan_id: planId,
});
```

**Dopo:**
```typescript
const { data, error } = await supabase.rpc('set_active_plan_v2', {
  p_coach_client_id: coachClientId,
  p_plan_id: planId,
});
```

Singola riga di modifica. Tutta la logica e nella RPC.

### 2.6 Tipi TypeScript

In `src/features/clients/types.ts` e `src/types/client.ts`, marcare:

```typescript
/** @deprecated Compat layer — do NOT use for business logic. Read from client_plan_assignments instead. */
active_plan_id?: string;
```

---

## 3. Riepilogo file modificati

| File | Modifica |
|------|----------|
| **SQL Migration** | RLS client + RPC `set_active_plan_v2` |
| `src/features/client-workouts/api/client-plans.api.ts` | Lettura da `client_plan_assignments` |
| `src/features/client-plans/api/client-plans.api.ts` | `getClientPlansWithActive()` + `saveClientPlanAsTemplate()` migrati |
| `src/features/client-plans/hooks/useSetActivePlan.ts` | Chiamata a `set_active_plan_v2` |
| `src/features/clients/api/clients.api.ts` | `listClients()`: join batch + filtro client-side |
| `src/features/clients/types.ts` | `active_plan_id` deprecated |
| `src/types/client.ts` | `active_plan_id` deprecated |

## 4. File NON modificati

| File | Motivo |
|------|--------|
| `supabase/functions/client-fsm/index.ts` | Gia migrato, continua a scrivere compat layer |
| Componenti UI | Consumano hook/API, nessun accesso diretto a `active_plan_id` |
| `useClientActivePlan.ts` | Chiama `getClientActivePlan()` che viene migrato internamente |
| `useClientPlansQuery.ts` | Chiama `getClientPlansWithActive()` che viene migrato internamente |

## 5. Performance

- `listClients`: la query batch su `client_plan_assignments` usa l'indice `idx_cpa_status_active` (gia creato) e il filtro `IN(client_ids)`. Nessun N+1.
- `getClientPlansWithActive`: una query in piu (assignment ACTIVE) ma e singola e indicizzata.
- `getClientActivePlan` (client): stesse 2 query di prima, ma su tabella diversa. Nessun impatto.

## 6. Garanzie

- Tutte le letture passano da `client_plan_assignments.status = 'ACTIVE'`
- Nessun file applicativo legge piu `clients.active_plan_id` o `coach_clients.active_plan_id`
- Nessuna logica di business dipende da `client_plans.status`
- Tutte le scritture critiche sono atomiche (RPC `set_active_plan_v2` e `fsm_assign_plan`)
- Nessuna regressione UI (stessi hook, stesse interfacce)
- `coach_clients.active_plan_id` resta sincronizzato in scrittura (compat layer)
