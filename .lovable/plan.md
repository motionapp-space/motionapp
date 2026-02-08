

# Allineare la logica di eliminazione: client_plan_assignments.status = 'DELETED' come source of truth

## Situazione attuale

| Componente | Hook usato | Cosa fa |
|------------|-----------|---------|
| `ClientDetail.tsx` | `useDeletePlanPermanent` | Chiama RPC `delete_plan` → setta solo `client_plans.deleted_at` |
| `ClientPlanEditor.tsx` | `useDeletePlanPermanent` | Stesso comportamento |
| FSM (non usato) | `useDeletePlan` | Chiama FSM `DELETE_PLAN` → setta `deleted_at` + `client_plan_assignments.status = 'DELETED'` |

**Problema**: Il frontend usa `useDeletePlanPermanent` che NON aggiorna `client_plan_assignments.status`, creando inconsistenza.

## Soluzione

### Strategia
Sostituire `useDeletePlanPermanent` con `useDeletePlan` (che usa il FSM) e aggiornare le query frontend per filtrare tramite `client_plan_assignments.status` invece di `client_plans.deleted_at`.

## File da modificare

| File | Modifica |
|------|----------|
| `src/pages/ClientDetail.tsx` | Sostituire import/uso di `useDeletePlanPermanent` con `useDeletePlan` |
| `src/pages/ClientPlanEditor.tsx` | Sostituire import/uso di `useDeletePlanPermanent` con `useDeletePlan` |
| `src/features/client-plans/api/client-plans.api.ts` | Filtrare piani tramite join con `client_plan_assignments` invece di `deleted_at IS NULL` |
| `src/features/client-workouts/api/client-plans.api.ts` | Rimuovere filtro `.is("deleted_at", null)` (ridondante con status ACTIVE) |
| `src/features/clients/hooks/useClientOnboardingState.ts` | Aggiornare filtro per usare assignment status |
| `src/features/client-plans/hooks/useDeletePlanPermanent.ts` | Eliminare (non più usato) |

## Dettaglio modifiche

### 1. `src/pages/ClientDetail.tsx`
```typescript
// Da:
import { useDeletePlanPermanent } from "@/features/client-plans/hooks/useDeletePlanPermanent";
const deletePlanMutation = useDeletePlanPermanent();

// A:
import { useDeletePlan } from "@/features/client-plans/hooks/useDeletePlan";
const deletePlanMutation = useDeletePlan();
```

### 2. `src/pages/ClientPlanEditor.tsx`
```typescript
// Da:
import { useDeletePlanPermanent } from "@/features/client-plans/hooks/useDeletePlanPermanent";
const deleteMutation = useDeletePlanPermanent();

// A:
import { useDeletePlan } from "@/features/client-plans/hooks/useDeletePlan";
const deleteMutation = useDeletePlan();
```

### 3. `src/features/client-plans/api/client-plans.api.ts`
La funzione `getClientPlansWithActive` deve filtrare i piani eliminati tramite `client_plan_assignments.status`:

```typescript
// Logica aggiornata:
// 1. Recupera tutti gli assignment per questo coach-client
// 2. Escludi quelli con status = 'DELETED'
// 3. Recupera i piani corrispondenti
```

### 4. `src/features/client-workouts/api/client-plans.api.ts`
```typescript
// Da:
.is("deleted_at", null)

// A:
// Rimuovere — il filtro ACTIVE nell'assignment è sufficiente
```

### 5. `src/features/clients/hooks/useClientOnboardingState.ts`
```typescript
// Da:
.is('deleted_at', null)

// A:
// Usare join con client_plan_assignments per escludere DELETED
```

### 6. `useDeletePlan` — aggiornare query invalidation
```typescript
// Aggiungere invalidazione di clientPlans query:
queryClient.invalidateQueries({ queryKey: ["clientPlans", variables.clientId] });
```

## Note tecniche

- Il FSM `DELETE_PLAN` già gestisce correttamente lo stato `DELETED` in `client_plan_assignments`
- La colonna `client_plans.deleted_at` può rimanere per backward compatibility ma non sarà più il filtro primario
- Piani legacy senza assignment continueranno a essere visibili (fallback su `deleted_at`)

## Riepilogo

| Categoria | File |
|-----------|------|
| Pagine | 2 (`ClientDetail.tsx`, `ClientPlanEditor.tsx`) |
| API | 2 (`client-plans.api.ts` x2) |
| Hooks | 2 (`useClientOnboardingState.ts`, `useDeletePlan.ts`) |
| Da eliminare | 1 (`useDeletePlanPermanent.ts`) |
| **Totale** | **7 file** |

