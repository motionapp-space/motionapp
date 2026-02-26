

## Analisi

Ho confrontato le edge function presenti in `supabase/functions/` con quelle dichiarate in `supabase/config.toml`.

### Edge functions esistenti (16):
`accept-invite`, `auto-complete-events`, `client-appointment-actions`, `client-fsm`, `compute-client-data`, `copilot`, `create-client-auth`, `create-invite`, `email-preview`, `email-worker`, `expire-packages`, `queue-booking-email`, `signup-coach`, `validate-coach-invite`, `validate-invite`

### Dichiarate in config.toml (14):
Tutte le 16 tranne **`copilot`**.

(`compute-client-data` e `client-fsm` sono state appena aggiunte nell'ultimo fix.)

### Funzione mancante: `copilot`

La funzione `copilot` **non** ha `verify_jwt = false` in `config.toml`. Questo significa che il gateway Supabase applica la validazione JWT di default, causando un **401** in produzione prima che il codice venga eseguito — lo stesso identico problema di `compute-client-data` e `client-fsm`.

La funzione `copilot` non implementa alcuna autenticazione interna (non usa `getUser()` né `getClaims()`), ma è chiamata dal client tramite `supabase.functions.invoke()` che invia automaticamente il token dell'utente. Tuttavia, con il sistema signing-keys, il gateway lo rifiuta comunque.

## Fix

**File: `supabase/config.toml`** — aggiungere:

```toml
[functions.copilot]
verify_jwt = false
```

Questa e l'unica funzione mancante. Dopo questo fix, tutte le 16 edge function saranno correttamente configurate.

