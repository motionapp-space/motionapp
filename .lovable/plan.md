

# Piano: Correzione Notifica Cancellazione per Distinguere Coach vs Client

## Problema Identificato
Quando il **cliente** cancella un appuntamento, il sistema genera erroneamente una notifica con:
- **Tipo**: `appointment_canceled_by_coach`
- **Messaggio**: "Il coach ha annullato l'appuntamento..."

Questo perché il trigger `trg_notify_client_event_canceled` si attiva quando `session_status` diventa `'canceled'`, ma non ha modo di sapere **chi** ha effettuato la cancellazione.

---

## Soluzione Proposta

Aggiungere una colonna `canceled_by` alla tabella `events` e aggiornare il trigger per generare notifiche differenziate.

---

## Modifiche

### TASK 1 — Aggiungere colonna `canceled_by` alla tabella events

**Migration SQL:**
```sql
ALTER TABLE public.events 
ADD COLUMN canceled_by text CHECK (canceled_by IN ('coach', 'client', 'system'));
```

### TASK 2 — Aggiornare RPC `cancel_event_with_ledger`

Modificare la riga che aggiorna l'evento per includere chi ha cancellato:

```sql
-- DA:
UPDATE events SET session_status = 'canceled' WHERE id = p_event_id;

-- A:
UPDATE events SET 
  session_status = 'canceled',
  canceled_by = p_actor
WHERE id = p_event_id;
```

### TASK 3 — Aggiornare il trigger `notify_client_event_canceled`

Modificare la funzione per:
1. **Se `canceled_by = 'coach'`**: inserire notifica tipo `appointment_canceled_by_coach`
2. **Se `canceled_by = 'client'`**: inserire notifica tipo `appointment_canceled_confirmed`
3. **Se `canceled_by IS NULL`**: nessuna notifica (fallback)

```sql
CREATE OR REPLACE FUNCTION public.notify_client_event_canceled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when session_status changes to 'canceled'
  IF NEW.session_status = 'canceled' 
     AND (OLD.session_status IS NULL OR OLD.session_status IS DISTINCT FROM 'canceled') 
     AND NEW.coach_client_id IS NOT NULL THEN
    
    IF NEW.canceled_by = 'coach' THEN
      -- Coach canceled: notify client
      INSERT INTO public.client_notifications (client_id, type, title, message, related_id, related_type)
      SELECT 
        cc.client_id,
        'appointment_canceled_by_coach',
        'Appuntamento annullato',
        'Il coach ha annullato l''appuntamento del ' || 
          to_char(NEW.start_at AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI'),
        NEW.id,
        'event'
      FROM public.coach_clients cc WHERE cc.id = NEW.coach_client_id;
      
    ELSIF NEW.canceled_by = 'client' THEN
      -- Client canceled: confirm to client
      INSERT INTO public.client_notifications (client_id, type, title, message, related_id, related_type)
      SELECT 
        cc.client_id,
        'appointment_canceled_confirmed',
        'Cancellazione confermata',
        'Hai annullato l''appuntamento del ' || 
          to_char(NEW.start_at AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI'),
        NEW.id,
        'event'
      FROM public.coach_clients cc WHERE cc.id = NEW.coach_client_id;
    END IF;
    -- If canceled_by IS NULL, no notification (legacy or system)
  END IF;
  
  RETURN NEW;
END;
$$;
```

---

## Risultato Atteso

| Scenario | Tipo Notifica | Messaggio |
|----------|---------------|-----------|
| Coach cancella | `appointment_canceled_by_coach` | "Il coach ha annullato l'appuntamento del..." |
| Cliente cancella | `appointment_canceled_confirmed` | "Hai annullato l'appuntamento del..." |

---

## Sezione Tecnica

### File da creare
- **Migration SQL** con:
  - `ALTER TABLE events ADD COLUMN canceled_by`
  - `CREATE OR REPLACE FUNCTION cancel_event_with_ledger` (aggiornata)
  - `CREATE OR REPLACE FUNCTION notify_client_event_canceled` (aggiornata)

### Dipendenze
- Il tipo `appointment_canceled_confirmed` esiste già in `src/features/client-notifications/types.ts`
- Il componente `ClientNotificationItem.tsx` gestisce già questo tipo con icona e colore appropriati

### Retrocompatibilità
- Eventi già cancellati avranno `canceled_by = NULL` → nessuna nuova notifica generata
- Nuove cancellazioni useranno il flusso corretto

