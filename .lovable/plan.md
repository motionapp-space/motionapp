
# Rimozione codice legacy: riferimenti a `client_plans.status`

## Analisi

Ho identificato tutti i riferimenti al campo legacy `client_plans.status` nel codebase. Questo campo è "frozen" (congelato al valore di creazione `IN_CORSO`) e non viene mai aggiornato dal sistema. La source of truth è `client_plan_assignments.status`.

## File da modificare

### 1. Definizioni di tipo (3 file)

| File | Problema | Azione |
|------|----------|--------|
| `src/features/clients/types.ts` | Esporta `PlanStatus` e `ClientPlanAssignment` con tipo errato | Rimuovere `PlanStatus`, aggiornare `ClientPlanAssignment` per usare `AssignmentStatus` |
| `src/types/client.ts` | Duplica `PlanStatus` e `ClientPlanAssignment` | Rimuovere tipi duplicati, re-esportare da `client-plans/types` |
| `src/types/template.ts` | `ClientPlanWithTemplate.status` usa valori legacy | Rimuovere campo `status` o marcare come opzionale/deprecated |

### 2. API e Hook (3 file)

| File | Problema | Azione |
|------|----------|--------|
| `src/features/client-plans/api/client-plans.api.ts` (riga 157) | `createClientPlanFromScratch` inserisce `status: "IN_CORSO"` | Rimuovere — il DB ha un default |
| `src/features/client-plans/hooks/useDuplicatePlan.ts` (riga 26) | Inserisce `status: "IN_CORSO"` | Rimuovere — il DB ha un default |
| `src/features/clients/hooks/useClientOnboardingState.ts` (riga 27) | Usa `.neq('status', 'ELIMINATO')` | Cambiare in `.is('deleted_at', null)` — criterio corretto |

### 3. Store (1 file)

| File | Problema | Azione |
|------|----------|--------|
| `src/stores/useClientStore.ts` (riga 3) | Importa `PlanStatus` (non usato) | Rimuovere import inutilizzato |

### 4. Edge Function (1 file)

| File | Problema | Azione |
|------|----------|--------|
| `supabase/functions/client-fsm/index.ts` | Legge `plan.status` per fallback legacy (righe 321, 393, 396) | Mantenere per backward compatibility con piani pre-esistenti senza assignment |

## Dettaglio modifiche

### `src/features/clients/types.ts`
```typescript
// RIMUOVERE (righe 2-6):
/**
 * @deprecated Legacy frozen field...
 */
export type PlanStatus = "IN_CORSO" | "COMPLETATO" | "ELIMINATO";

// AGGIORNARE PlanStateLog (righe 112-119):
// Re-importare tipo da client-plans/types se serve per logging
```

### `src/types/client.ts`
```typescript
// RIMUOVERE (righe 2-6):
export type PlanStatus = ...

// RIMUOVERE (righe 47-54):
export interface ClientPlanAssignment { ... }  // Duplicato

// Aggiungere re-export se necessario:
export type { AssignmentStatus, ClientPlanAssignment } from '@/features/client-plans/types';
```

### `src/types/template.ts`
```typescript
// MODIFICARE ClientPlanWithTemplate (riga 52):
// Rimuovere:
status: 'IN_CORSO' | 'COMPLETATO' | 'ELIMINATO';
// Il campo viene ancora restituito dal DB ma non deve essere usato
```

### `src/features/client-plans/api/client-plans.api.ts`
```typescript
// RIMUOVERE riga 157:
status: "IN_CORSO",  // <- Il DB ha un default, non serve
```

### `src/features/client-plans/hooks/useDuplicatePlan.ts`
```typescript
// RIMUOVERE riga 26:
status: "IN_CORSO",  // <- Il DB ha un default, non serve
```

### `src/features/clients/hooks/useClientOnboardingState.ts`
```typescript
// CAMBIARE riga 27:
// Da:
.neq('status', 'ELIMINATO')
// A:
.is('deleted_at', null)
```

### `src/stores/useClientStore.ts`
```typescript
// RIMUOVERE import non usato (riga 3):
import type { ..., PlanStatus, ... } from "@/types/client";
// Diventa:
import type { Client, ClientTag, ClientWithTags, ClientWithDetails, ActivityType } from "@/types/client";
```

## Cosa NON modificare

- **`supabase/functions/client-fsm/index.ts`**: Mantiene lettura di `plan.status` per backward compatibility con piani legacy senza assignment
- **`src/features/client-plans/types.ts`**: Mantiene `status: PlanStatus` nell'interfaccia `ClientPlan` perché il campo esiste ancora nel DB — ma è già documentato come deprecated
- **`src/integrations/supabase/types.ts`**: Generato automaticamente da Supabase, non modificare manualmente

## Impatto

- **Nessun impatto funzionale**: Il campo `status` non viene mai letto per business logic
- **Codice più pulito**: Rimozione di tipi duplicati e import inutilizzati
- **Query corretta**: `useClientOnboardingState` userà `deleted_at` invece del legacy `status`

## Riepilogo modifiche

| Categoria | File modificati |
|-----------|-----------------|
| Tipi | 3 |
| API/Hook | 3 |
| Store | 1 |
| **Totale** | **7 file** |
