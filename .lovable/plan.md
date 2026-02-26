

## Problema

Entrambe le edge function `compute-client-data` e `client-fsm` **non sono presenti in `supabase/config.toml`**. Senza la riga `verify_jwt = false`, il gateway Supabase applica la validazione JWT di default che con il sistema signing-keys **non funziona** — restituendo 401 prima ancora che il codice della funzione venga eseguito (per questo non ci sono log).

Entrambe le funzioni già validano l'autenticazione nel codice tramite `getUser()`, quindi è sicuro disabilitare la verifica JWT a livello di gateway.

## Fix

**File: `supabase/config.toml`** — aggiungere:

```toml
[functions.compute-client-data]
verify_jwt = false

[functions.client-fsm]
verify_jwt = false
```

Nessuna altra modifica necessaria. Dopo il deploy, le funzioni gestiranno l'auth internamente come già fanno.

