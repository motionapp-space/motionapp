

## Diagnosi

Dai log Supabase, i **401** in produzione provengono dalle edge function `client-fsm` e `compute-client-data`. Il flusso è:

1. Il browser chiama `supabase.functions.invoke()` che include l'header `Authorization`
2. L'edge function crea un client Supabase con quell'header e chiama `getUser()`
3. `getUser()` fa una richiesta a `/auth/v1/user` — e questa fallisce con `no_authorization`

**Causa principale**: gli header CORS delle edge function sono incompleti. La versione `@supabase/supabase-js@2.75+` invia header aggiuntivi (`x-supabase-client-platform`, `x-supabase-client-platform-version`, etc.). Se il preflight CORS non li autorizza, il browser blocca la richiesta effettiva — l'edge function non riceve mai l'header `Authorization` e restituisce 401.

## Piano

Aggiornare gli header CORS in **tutte le edge function** che usano il pattern ridotto. Sostituire:

```
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
```

con:

```
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version'
```

### File da modificare

1. `supabase/functions/client-fsm/index.ts` (riga 5)
2. `supabase/functions/compute-client-data/index.ts` (riga 5)
3. Tutte le altre edge function che usano lo stesso pattern ridotto (da verificare: `copilot`, `client-appointment-actions`, `queue-booking-email`, `create-invite`, `validate-invite`, `accept-invite`, `signup-coach`, `validate-coach-invite`, `create-client-auth`, `auto-complete-events`, `expire-packages`, `email-preview`, `email-worker`)

### Dopo la modifica

- Deploy di tutte le edge function modificate
- Pubblicare in produzione per applicare il fix su `motionapp.xyz`

