

## Fix: Ambiguita' overload RPC `cancel_event_with_ledger`

### Problema

Esistono due versioni della funzione RPC `cancel_event_with_ledger`:
- `(p_event_id, p_actor, p_now)` -- senza client_user_id
- `(p_event_id, p_actor, p_now, p_client_user_id)` -- con client_user_id

Quando si passano solo `p_event_id` e `p_actor`, PostgREST non riesce a scegliere quale delle due chiamare perche' entrambe matchano (i parametri mancanti sono tutti opzionali).

### Soluzione

Passare esplicitamente `p_now` nella chiamata RPC dentro `useDeleteEvent.ts`. Questo disambigua verso il primo overload (senza `p_client_user_id`), che e' quello corretto per il coach.

### Dettagli tecnici

**File: `src/features/events/hooks/useDeleteEvent.ts`**

Aggiungere `p_now: new Date().toISOString()` alla chiamata RPC:

```typescript
const { data, error } = await supabase.rpc('cancel_event_with_ledger', {
  p_event_id: id,
  p_actor: 'coach',
  p_now: new Date().toISOString(),
});
```

Modifica di una sola riga, nessun altro file coinvolto.

