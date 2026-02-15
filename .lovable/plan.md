

## Aggiungere email e notifica in-app al cliente quando il coach crea un appuntamento

### Contesto

Quando il coach crea un appuntamento direttamente dal calendario, il cliente non riceve ne' email ne' notifica in-app. Questo e' diverso dal flusso booking request (dove il cliente richiede e il coach approva), che ha gia' entrambi i meccanismi.

### Soluzione

Due interventi paralleli:
1. **Notifica in-app**: trigger DB su INSERT nella tabella `events` (coerente con il pattern esistente per le cancellazioni)
2. **Email**: nuovo tipo email `appointment_created_by_coach` con template dedicato, accodato dal frontend dopo la creazione

---

### 1. Migrazione SQL

**Nuovo tipo nella CHECK constraint di `client_notifications`:**
- Aggiungere `'appointment_created_by_coach'` alla lista dei tipi ammessi

**Nuovo trigger `notify_client_event_created`:**
- Si attiva su `AFTER INSERT ON events`
- Condizione: `NEW.source = 'coach'` e `NEW.session_status IS DISTINCT FROM 'canceled'`
- Inserisce una riga in `client_notifications` con tipo `appointment_created_by_coach`, titolo "Nuovo appuntamento", messaggio con data/ora formattata

### 2. Nuovo tipo email

**File: `supabase/functions/_shared/email-outbox.ts`**
- Aggiungere `'appointment_created_by_coach'` a `EmailType`

**File: `supabase/functions/_shared/email-template-data.ts`**
- Aggiungere caso `'appointment_created_by_coach'` in `buildTemplateData` (stessi dati base di `appointment_accepted`)

**File: `supabase/functions/_shared/emails/types.ts`**
- Aggiungere `AppointmentCreatedByCoachTemplateData` (estende `AppointmentBaseTemplateData`, nessun campo extra)

### 3. Nuovo template email

**File: `supabase/functions/_shared/emails/appointment/created-by-coach-client.tsx`**
- Template simile a `accepted-client.tsx` ma con copy dedicato:
  - Heading: "Nuovo appuntamento programmato"
  - Body: "{coach_name} ha fissato un appuntamento per te"
  - InfoBox: data, orario, titolo
  - Subject: "Nuovo appuntamento con {coach_name}"

**File: `supabase/functions/_shared/emails/index.ts`**
- Registrare `'appointment_created_by_coach:client'` nel registry

### 4. Aggiornare edge function `queue-booking-email`

**File: `supabase/functions/queue-booking-email/index.ts`**
- Aggiungere `'appointment_created_by_coach'` a `BookingEmailType`
- Aggiungere validazione in `REQUIRED_FIELDS`
- La logica di routing destinatario funziona gia' (actor_role = 'coach' -> email a client)

### 5. Accodare email dal frontend

**File: `src/features/events/components/EventEditorModal.tsx`**
- Nel metodo `handleCreate`, dopo la creazione riuscita dell'evento singolo (non ricorrente):
  - Recuperare `coach_client_id` (gia' disponibile)
  - Costruire snapshot con `buildEventSnapshot`
  - Accodare email con `queueBookingEmailWithSnapshot({ type: 'appointment_created_by_coach', ... })`
- Per le ricorrenze: accodare una singola email con i dati del primo appuntamento (evita spam)

**File: `src/features/client-notifications/types.ts`**
- Aggiungere `'appointment_created_by_coach'` a `ClientNotificationType`

**File: `src/lib/email-snapshot.types.ts`**
- Aggiungere `'appointment_created_by_coach'` a `BookingEmailType`

### Flusso risultante

```text
Coach crea appuntamento dal calendario
        |
        v
EventEditorModal.handleCreate
        |
        +-- supabase.rpc('create_event_with_economics_internal')
        |       |
        |       +-- INSERT events (source = 'coach')
        |       |
        |       +-- [TRIGGER] notify_client_event_created
        |               +-- INSERT client_notifications
        |                   (tipo: appointment_created_by_coach)
        |
        +-- buildEventSnapshot + queueBookingEmailWithSnapshot
                +-- Edge Function queue-booking-email
                        +-- INSERT email_messages
                                +-- [WORKER] invio email al cliente
```

### File coinvolti (riepilogo)

| File | Modifica |
|------|----------|
| Migrazione SQL | CHECK constraint + trigger |
| `email-outbox.ts` | Nuovo EmailType |
| `email-template-data.ts` | Nuovo caso in buildTemplateData |
| `emails/types.ts` | Nuovo tipo template data |
| `emails/appointment/created-by-coach-client.tsx` | **Nuovo file** - template email |
| `emails/index.ts` | Registrazione template |
| `queue-booking-email/index.ts` | Nuovo tipo + validazione |
| `EventEditorModal.tsx` | Accodamento email dopo creazione |
| `client-notifications/types.ts` | Nuovo tipo notifica |
| `email-snapshot.types.ts` | Nuovo tipo email |

