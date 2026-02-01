
# Piano: Edge Function `email-worker`

## Obiettivo
Creare una Edge Function che processa la coda `email_messages` e invia email tramite Resend, utilizzando l'infrastruttura di template/rendering già esistente.

## Componenti Esistenti Riutilizzati

| Componente | Percorso | Utilizzo |
|------------|----------|----------|
| Renderer | `_shared/emails/renderer.ts` | `renderEmail()` per HTML + subject |
| Template Registry | `_shared/emails/index.ts` | Mapping type → template React |
| Supabase Client | Standard Deno import | Query e update `email_messages` |

## Struttura DB `email_messages`

```text
id                  uuid (PK)
type                email_type (enum)
to_email            text
status              email_status ('pending' | 'sent' | 'failed')
template_data       jsonb
attempt_count       integer (default 0)
scheduled_at        timestamptz
sent_at             timestamptz (nullable)
failed_at           timestamptz (nullable)
provider_message_id text (nullable)
last_error          text (nullable)
created_at          timestamptz
updated_at          timestamptz
```

## File da Creare/Modificare

| File | Azione |
|------|--------|
| `supabase/functions/email-worker/index.ts` | Nuovo |
| `supabase/config.toml` | Modifica (aggiunta config) |

---

## Dettagli Tecnici

### 1. Edge Function `email-worker/index.ts`

**Flusso principale:**

```text
1. Verifica header x-worker-secret
      │
      ├── Mancante/errato → 401 Unauthorized
      │
      ▼
2. Query email pending (max 10)
      │
      ▼
3. Per ogni email:
   ├── renderEmail(type, template_data) → {subject, html}
   ├── Resend.send({from, to, subject, html})
   │     │
   │     ├── OK → UPDATE status='sent', sent_at, provider_message_id
   │     │
   │     └── Errore → UPDATE attempt_count++, last_error
   │           │
   │           └── attempt_count >= 3 → status='failed', failed_at
   │
4. Response JSON: {processed, sent, failed}
```

**Dipendenze:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { renderEmail } from "../_shared/emails/renderer.ts";
```

**Autenticazione worker:**
- Header richiesto: `x-worker-secret`
- Env var: `WORKER_SECRET`
- Se mancante o errato: risposta 401

**Query email pending:**
```sql
SELECT *
FROM email_messages
WHERE status = 'pending'
  AND scheduled_at <= now()
ORDER BY created_at
LIMIT 10
```

Nota: `FOR UPDATE SKIP LOCKED` non è supportato dal client Supabase, ma in ambiente DEV con invocazioni manuali il rischio di race condition è minimo.

**Configurazione Resend:**
```typescript
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Sender configurabile via env, fallback a valore fisso
const FROM_EMAIL = Deno.env.get("EMAIL_FROM") || "Motion <noreply@motion.app>";
```

**Update successo:**
```typescript
await supabase
  .from('email_messages')
  .update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    provider_message_id: resendResponse.id,
    updated_at: new Date().toISOString()
  })
  .eq('id', email.id);
```

**Update errore:**
```typescript
const newAttemptCount = email.attempt_count + 1;
const updateData = {
  attempt_count: newAttemptCount,
  last_error: error.message,
  updated_at: new Date().toISOString(),
  ...(newAttemptCount >= 3 ? {
    status: 'failed',
    failed_at: new Date().toISOString()
  } : {})
};
```

### 2. Aggiornamento `config.toml`

```toml
[functions.email-worker]
verify_jwt = false
```

---

## Secrets Necessari

| Nome | Descrizione | Dove Configurare |
|------|-------------|------------------|
| `RESEND_API_KEY` | API key Resend (già aggiunta) | Supabase Dashboard |
| `WORKER_SECRET` | Secret per autenticare chiamate al worker | Supabase Dashboard |
| `EMAIL_FROM` | Indirizzo mittente (opzionale) | Supabase Dashboard |

Per `WORKER_SECRET`: generare un valore random (es. `openssl rand -hex 32`) e configurarlo in Supabase Edge Function Secrets.

---

## Response Format

**Successo (200):**
```json
{
  "processed": 5,
  "sent": 4,
  "failed": 1,
  "details": [
    {"id": "uuid-1", "status": "sent", "to": "user@example.com"},
    {"id": "uuid-2", "status": "failed", "error": "Invalid email"}
  ]
}
```

**Errore autenticazione (401):**
```json
{
  "error": "Unauthorized"
}
```

---

## Invocazione Manuale (DEV)

```bash
curl -X POST \
  https://qadgzwsmiadxwwvsrauz.supabase.co/functions/v1/email-worker \
  -H "Content-Type: application/json" \
  -H "x-worker-secret: YOUR_WORKER_SECRET"
```

---

## Esclusioni (come richiesto)

- Nessun trigger automatico/cron
- Nessun exponential backoff
- Nessuna modifica schema DB
- Nessuna logica di dominio
- Nessun accesso a tabelle diverse da `email_messages`
