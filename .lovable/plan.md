
# Fix eliminazione piano: gestione assignment duplicati

## Problema identificato

Quando elimini un piano, lo status rimane `COMPLETED` invece di diventare `DELETED` perché:

1. **Backend**: La query `.single()` fallisce quando trova più di un assignment per lo stesso piano (duplicati creati da assegnazioni multiple)
2. **Frontend**: Il filtro `.neq("status", "DELETED")` mostra ancora piani con status `COMPLETED` anche se eliminati

### Dati nel database
```
Piano b29c1829-a8ab-4a25-9b6c-ed22488a8f76 ("Template 1"):
- Assignment 1: status = COMPLETED
- Assignment 2: status = COMPLETED
- client_plans.deleted_at = settato (eliminato)
```

## Soluzione

### 1. Backend: Usare `maybeSingle()` + gestire duplicati

**File**: `supabase/functions/client-fsm/index.ts`

```typescript
// Da (riga 305):
.single();

// A:
.order('assigned_at', { ascending: false })
.limit(1)
.maybeSingle();
```

E aggiornare **tutti** gli assignment duplicati quando si elimina:

```typescript
// Alla riga 346-354, sostituire con:
await supabase
  .from('client_plan_assignments')
  .update({
    status: 'DELETED' as AssignmentStatus,
    ended_at: new Date().toISOString(),
  })
  .eq('plan_id', planId)
  .eq('coach_id', userId)
  .eq('client_id', client.id);
```

### 2. Frontend: Deduplica piani per ID

**File**: `src/features/client-plans/api/client-plans.api.ts`

```typescript
// Deduplica plan_id prima del fetch
const uniquePlanIds = [...new Set(assignments.map(a => a.plan_id))];
```

E determinare lo stato effettivo considerando tutti gli assignment:

```typescript
// Un piano è "deleted" se TUTTI i suoi assignment sono DELETED
const deletedPlanIds = new Set(
  Object.entries(
    assignments.reduce((acc, a) => {
      if (!acc[a.plan_id]) acc[a.plan_id] = [];
      acc[a.plan_id].push(a.status);
      return acc;
    }, {} as Record<string, string[]>)
  )
  .filter(([_, statuses]) => statuses.every(s => s === 'DELETED'))
  .map(([planId]) => planId)
);

const visiblePlanIds = uniquePlanIds.filter(id => !deletedPlanIds.has(id));
```

## File da modificare

| File | Modifica |
|------|----------|
| `supabase/functions/client-fsm/index.ts` | Usare `maybeSingle()`, aggiornare TUTTI gli assignment per plan_id |
| `src/features/client-plans/api/client-plans.api.ts` | Deduplica plan_id, gestire stati multipli per piano |

## Migration DML (opzionale)

Per correggere i dati esistenti, esegui:

```sql
UPDATE client_plan_assignments 
SET status = 'DELETED', ended_at = NOW()
WHERE plan_id IN (
  SELECT id FROM client_plans WHERE deleted_at IS NOT NULL
);
```

## Riepilogo

| Categoria | File |
|-----------|------|
| Edge Function | 1 |
| API Frontend | 1 |
| Migration DML | 1 query (opzionale) |
| **Totale** | **2 file + 1 migration** |
