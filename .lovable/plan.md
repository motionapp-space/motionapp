

## Fix: Disambiguare completamente l'overload RPC

### Problema

Passare 3 parametri (`p_event_id`, `p_actor`, `p_now`) non basta: PostgREST vede che entrambi gli overload matchano perche' `p_client_user_id` ha un valore di default nella seconda versione.

### Soluzione

Passare esplicitamente `p_client_user_id: null` nella chiamata RPC. Questo forza PostgREST a usare l'overload a 4 parametri con `p_client_user_id = NULL`, eliminando ogni ambiguita'.

### Dettaglio tecnico

**File: `src/features/events/hooks/useDeleteEvent.ts`** (riga 33-37)

```typescript
const { data, error } = await supabase.rpc('cancel_event_with_ledger', {
  p_event_id: id,
  p_actor: 'coach',
  p_now: new Date().toISOString(),
  p_client_user_id: null,   // <-- aggiunta per disambiguare
});
```

Modifica di una sola riga, nessun altro file coinvolto.
