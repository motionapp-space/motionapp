
# Piano: Fix Constraint Legacy per Eventi Single Paid

## Problema Identificato

Quando il coach approva o riprogramma una richiesta di appuntamento, si verifica l'errore:

> `new row for relation "events" violates check constraint "chk_events_economic_refs"`

**Causa**: Il constraint `chk_events_economic_refs` richiede che per eventi con `economic_type = 'single_paid'`, la colonna `order_payment_id` sia NOT NULL. Ma:

1. La tabella `order_payments` è stata sostituita da `orders`
2. La nuova architettura usa una FK inversa: `orders.event_id` → `events.id`
3. La funzione `finalize_booking_request` inserisce in `orders` ma non popola `events.order_payment_id`

---

## Soluzione

Aggiornare il constraint per riflettere il nuovo design dove `single_paid` non richiede più `order_payment_id` come campo obbligatorio (la relazione è gestita da `orders.event_id`).

---

## Modifiche

### Migration SQL

```sql
-- 1. Rimuove il constraint legacy
ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_events_economic_refs;

-- 2. Ricrea con la nuova logica (order_payment_id non più richiesto)
ALTER TABLE events ADD CONSTRAINT chk_events_economic_refs CHECK (
  (economic_type = 'package' AND package_id IS NOT NULL AND order_payment_id IS NULL)
  OR (economic_type = 'single_paid' AND package_id IS NULL)
  OR (economic_type IN ('none', 'free') AND package_id IS NULL AND order_payment_id IS NULL)
);
```

### Cosa cambia

| Tipo | Prima | Dopo |
|------|-------|------|
| `package` | `package_id NOT NULL, order_payment_id NULL` | Invariato |
| `single_paid` | ~~`order_payment_id NOT NULL`~~ | `package_id NULL` (nessun requisito su order_payment_id) |
| `none/free` | Entrambi NULL | Invariato |

---

## Verifiche Post-Implementazione

- [ ] Coach può approvare richieste con `single_paid`
- [ ] Coach può inviare controproposte
- [ ] Ordine viene creato in tabella `orders` con `event_id` corretto

---

## Sezione Tecnica

### Architettura Attuale

```text
PRIMA (legacy):
events.order_payment_id ──► order_payments.id
                             (tabella deprecata)

DOPO (nuovo):
orders.event_id ──────────► events.id
                             (FK inversa)
```

### Impatto

- **Nessuna modifica a codice frontend**
- **Nessuna modifica a funzioni RPC** (già usano correttamente `orders`)
- La colonna `order_payment_id` rimane per retrocompatibilità ma non è più obbligatoria

### Retrocompatibilità

- Eventi esistenti: nessun impatto (0 righe usano `order_payment_id`)
- Nuovi eventi `single_paid`: funzioneranno senza richiedere `order_payment_id`
