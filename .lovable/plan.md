
# Piano: Fix Typo nel Trigger `notify_client_counter_proposal`

## Problema Identificato

Il trigger `trg_notify_client_counter_proposal` si attiva su **ogni UPDATE** della tabella `booking_requests`. All'interno della funzione, PostgreSQL tenta di confrontare:

```sql
IF NEW.status = 'COUNTER_PROPOSAL' AND ...
```

**Il problema**: PostgreSQL deve convertire la stringa `'COUNTER_PROPOSAL'` al tipo enum `booking_request_status` per poterla confrontare con `NEW.status`. Ma questo valore non esiste nell'enum!

### Valori dell'enum `booking_request_status`:
| Valore | ✓/✗ |
|--------|-----|
| PENDING | ✓ |
| APPROVED | ✓ |
| DECLINED | ✓ |
| **COUNTER_PROPOSED** | ✓ (con la D) |
| CANCELED_BY_CLIENT | ✓ |
| COUNTER_PROPOSAL | ✗ (non esiste) |

### Perché l'errore avviene durante l'approvazione?

1. Coach clicca "Approva"
2. `finalize_booking_request` viene chiamata
3. La funzione esegue `UPDATE booking_requests SET status = 'APPROVED'`
4. Il trigger `trg_notify_client_counter_proposal` si attiva (su AFTER UPDATE)
5. PostgreSQL valuta la condizione IF → tenta di castare `'COUNTER_PROPOSAL'` all'enum → **ERRORE**

L'errore si verifica **prima** ancora che PostgreSQL possa verificare se la condizione è vera o falsa.

---

## Soluzione

Correggere il typo nella funzione trigger: `COUNTER_PROPOSAL` → `COUNTER_PROPOSED`

---

## Migration SQL

```sql
-- Fix typo: COUNTER_PROPOSAL → COUNTER_PROPOSED
CREATE OR REPLACE FUNCTION public.notify_client_counter_proposal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COUNTER_PROPOSED' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'COUNTER_PROPOSED') THEN
    INSERT INTO public.client_notifications (client_id, type, title, message, related_id, related_type)
    SELECT 
      cc.client_id,
      'counter_proposal_received',
      'Proposta nuovo orario',
      'Il coach propone: ' || to_char(NEW.counter_proposal_start_at AT TIME ZONE 'Europe/Rome', 'DD/MM "alle" HH24:MI'),
      NEW.id,
      'booking_request'
    FROM public.coach_clients cc WHERE cc.id = NEW.coach_client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## Cosa cambia

| Prima | Dopo |
|-------|------|
| `'COUNTER_PROPOSAL'` (2 occorrenze) | `'COUNTER_PROPOSED'` (2 occorrenze) |

---

## Verifiche Post-Implementazione

- [ ] Coach può approvare richieste di appuntamento
- [ ] Coach può inviare controproposte
- [ ] Coach può rifiutare richieste
- [ ] Cliente riceve notifiche corrette

---

## Sezione Tecnica

### Causa root
Il trigger è stato creato con un typo nel migration file `20260123120554_c2cc8855-76c8-45da-9339-0d56ead2c936.sql` (linea 78).

### File impattati
Solo migration SQL per correggere la funzione trigger. Nessuna modifica al frontend.

### Impatto
- Nessun impatto sui dati esistenti
- Fix immediato di tutte le operazioni UPDATE su `booking_requests`
