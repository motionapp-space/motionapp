
# Rimozione stato PAUSED da AssignmentStatus

## Analisi

Ho verificato che:
1. **Database**: La colonna `status` in `client_plan_assignments` è di tipo `text` con default `'ACTIVE'`
2. **Valori esistenti**: Solo `ACTIVE` e `COMPLETED` sono presenti nel database
3. **Nessun uso di PAUSED**: Nessuna riga ha mai usato questo stato

## File da modificare

| File | Modifica |
|------|----------|
| `src/features/client-plans/types.ts` | Rimuovere `'PAUSED'` dal tipo `AssignmentStatus` |
| `supabase/functions/client-fsm/index.ts` | Rimuovere `'PAUSED'` dal tipo `AssignmentStatus` |

## Dettaglio modifiche

### `src/features/client-plans/types.ts` (riga 10)
```typescript
// Da:
export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'DELETED' | 'PAUSED';

// A:
export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'DELETED';
```

### `supabase/functions/client-fsm/index.ts` (riga 14)
```typescript
// Da:
type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'DELETED' | 'PAUSED';

// A:
type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'DELETED';
```

## Note

- **Nessun impatto funzionale**: Lo stato `PAUSED` non è mai stato usato
- **Nessun cambio al database**: La colonna è di tipo `text`, non enum — nessuna migrazione necessaria
- I riferimenti a `isPaused` in altri file (come `useSessionStore.ts`) riguardano il **timer delle sessioni di allenamento**, non lo stato degli assignment dei piani

## Riepilogo

| Categoria | File |
|-----------|------|
| Tipi frontend | 1 |
| Edge Function | 1 |
| **Totale** | **2 file** |
