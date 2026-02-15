

## Migrazione: aggiungere 'coach' al check constraint events_source_check

### Cosa fare

Una singola migrazione SQL:

```sql
ALTER TABLE events DROP CONSTRAINT events_source_check;
ALTER TABLE events ADD CONSTRAINT events_source_check
  CHECK (source = ANY (ARRAY['manual', 'generated', 'client', 'coach']));
```

### Verifica

Dopo la migrazione, testare la creazione di un evento dal calendario (`/calendar/manage`) per confermare che il constraint non blocca piu' l'inserimento.

### Rischio

Zero. Si aggiunge un valore ammesso senza rimuoverne di esistenti. Nessun cambio al codice frontend.

