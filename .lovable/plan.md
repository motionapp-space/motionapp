

# Rename COMPLETED → INACTIVE (solo Backend)

## Obiettivo

Rinominare lo stato `COMPLETED` in `INACTIVE` per la `AssignmentStatus` solo a livello backend, senza modifiche visuali frontend.

## File da modificare

| File | Modifica |
|------|----------|
| `src/features/client-plans/types.ts` | `'COMPLETED'` → `'INACTIVE'` nel tipo `AssignmentStatus` |
| `supabase/functions/client-fsm/index.ts` | Tutti i riferimenti `'COMPLETED'` → `'INACTIVE'` |

## Migration DML (da eseguire in Supabase)

```sql
UPDATE client_plan_assignments 
SET status = 'INACTIVE' 
WHERE status = 'COMPLETED';
```

## Dettaglio modifiche

### `src/features/client-plans/types.ts` (riga 10)
```typescript
// Da:
export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'DELETED';

// A:
export type AssignmentStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';
```

### `supabase/functions/client-fsm/index.ts`

| Riga | Da | A |
|------|-----|-----|
| 14 | `type AssignmentStatus = 'ACTIVE' \| 'COMPLETED' \| 'DELETED'` | `type AssignmentStatus = 'ACTIVE' \| 'INACTIVE' \| 'DELETED'` |
| 25 | `'COMPLETED': 'COMPLETATO'` | `'INACTIVE': 'COMPLETATO'` |
| 233 | `status: 'COMPLETED' as AssignmentStatus` | `status: 'INACTIVE' as AssignmentStatus` |
| 329-330 | `assignment.status === 'COMPLETED'` + messaggio | `assignment.status === 'INACTIVE'` + messaggio aggiornato |
| 400-401 | `assignment.status === 'COMPLETED'` | `assignment.status === 'INACTIVE'` |
| 425 | `status: 'COMPLETED' as AssignmentStatus` | `status: 'INACTIVE' as AssignmentStatus` |

### Messaggi di errore aggiornati

```typescript
// Riga 330 - Da:
throw new Error('Cannot delete a completed plan');
// A:
throw new Error('Cannot delete an inactive plan');

// Riga 401 - Da:
return { success: true, message: 'Already completed' };
// A:
return { success: true, message: 'Already inactive' };
```

## Note

- **Nessun impatto frontend visivo**: Il tipo cambia nome ma nessun componente UI mostra questo stato
- **Backward compatibility log**: Il mapping legacy `INACTIVE` → `COMPLETATO` mantiene la compatibilità con `plan_state_logs`
- **Migration DML necessaria**: I record esistenti con `COMPLETED` devono essere aggiornati a `INACTIVE`

## Riepilogo

| Categoria | File |
|-----------|------|
| Tipi frontend | 1 |
| Edge Function | 1 |
| Migration DML | 1 query |
| **Totale** | **2 file + 1 migration** |

