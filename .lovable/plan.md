

# Finalizzazione migrazione: pulizia dead code e filtri legacy

## Panoramica

Eliminare gli ultimi riferimenti a `client_plans.status` nei componenti UI, rimuovere dead code, droppare la RPC legacy, e aggiungere deprecation esplicite.

---

## 1. Migrazione filtri UI

### 1a. `src/features/sessions/components/DayPicker.tsx` (riga 33)

Prima:
```typescript
const activePlans = clientPlans.filter((p) => p.status === "IN_CORSO");
```

Dopo:
```typescript
const activePlans = clientPlans.filter((p) => p.isActiveForClient);
```

Nessun'altra modifica al componente. L'import di `ClientPlan` (riga 11) diventa `ClientPlanWithActive` (gia il tipo restituito da `useClientPlansQuery`).

### 1b. `src/features/events/components/EventEditorModal.tsx` (riga 220)

Prima:
```typescript
const activePlans = clientPlans.filter((p) => p.status === "IN_CORSO");
```

Dopo:
```typescript
const activePlans = clientPlans.filter((p) => p.isActiveForClient);
```

---

## 2. Eliminazione dead code

### 2a. Eliminare file `src/features/client-plans/api/auto-complete-plans.api.ts`
Non importato da nessun file. Logica ora in RPC/FSM.

### 2b. Rimuovere `updateClientPlanStatus` da `src/features/client-plans/api/client-plans.api.ts` (righe 175-177)
Non importata da nessun file. Viola il principio frozen.

---

## 3. Documentazione scritture legacy

### 3a. `createClientPlanFromScratch` in `client-plans.api.ts` (riga 137)
Aggiungere commento:
```typescript
/**
 * Creates a plan draft. Does NOT activate the plan.
 * Activation must be performed explicitly via set_active_plan_v2 or FSM assignment.
 * The status "IN_CORSO" is a legacy DB default and must NOT be read as business state.
 */
```

### 3b. `useDuplicatePlan` in `useDuplicatePlan.ts` (riga 6)
Aggiungere commento:
```typescript
/**
 * Duplicates a plan as a draft. Does NOT activate the duplicated plan.
 * Activation must be performed explicitly via set_active_plan_v2 or FSM assignment.
 * The status "IN_CORSO" is a legacy DB default and must NOT be read as business state.
 */
```

---

## 4. Drop RPC legacy `set_active_plan`

Migrazione SQL:
```sql
DROP FUNCTION IF EXISTS set_active_plan(uuid, uuid);
```

Confermato: nessun riferimento nel frontend ne nelle edge functions.

---

## 5. Deprecation esplicita nei tipi

### `src/features/clients/types.ts` (riga 2) e `src/types/client.ts` (riga 2)

```typescript
/**
 * @deprecated Legacy frozen field. Do NOT use for business logic.
 * Read from client_plan_assignments.status instead.
 */
export type PlanStatus = "IN_CORSO" | "COMPLETATO" | "ELIMINATO";
```

---

## Riepilogo file modificati

| File | Azione |
|------|--------|
| `src/features/sessions/components/DayPicker.tsx` | Filtro `status` -> `isActiveForClient`, fix import |
| `src/features/events/components/EventEditorModal.tsx` | Filtro `status` -> `isActiveForClient` |
| `src/features/client-plans/api/auto-complete-plans.api.ts` | Eliminare |
| `src/features/client-plans/api/client-plans.api.ts` | Rimuovere `updateClientPlanStatus`, aggiungere doc a `createClientPlanFromScratch` |
| `src/features/client-plans/hooks/useDuplicatePlan.ts` | Aggiungere doc |
| `src/features/clients/types.ts` | Deprecare `PlanStatus` |
| `src/types/client.ts` | Deprecare `PlanStatus` |
| **SQL Migration** | `DROP FUNCTION IF EXISTS set_active_plan(uuid, uuid)` |

## Garanzie

- Nessun filtro UI usa piu `client_plans.status`
- Nessuna funzione applicativa legge `active_plan_id`
- Nessuna funzione aggiorna `client_plans.status`
- DayPicker ed EventEditorModal mostrano SOLO il piano attivo (`isActiveForClient`)
- Dead code eliminato completamente
- RPC legacy droppata
- Nessuna regressione: stesse interfacce componenti, stessi hook

