

# Piano: Rimozione Constraint Legacy `payment_kind_check`

## Problema

Il constraint `payment_kind_check` sulla tabella `orders` accetta solo i valori legacy:
- `charge`, `refund`, `deposit`

Ma la funzione `finalize_booking_request` inserisce correttamente `kind = 'single_lesson'` secondo la nuova architettura.

## Constraint attuali sulla tabella `orders`

| Constraint | Valori ammessi | Stato |
|------------|----------------|-------|
| `payment_kind_check` | `charge`, `refund`, `deposit` | **Legacy - da rimuovere** |
| `chk_order_kind` | `single_lesson`, `package_purchase` | Nuovo - corretto |
| `chk_order_kind_refs` | Tutti + coerenza FK | Nuovo - corretto |

## Soluzione

Rimuovere il constraint legacy `payment_kind_check` che blocca i nuovi valori.

## Modifica

### Migration SQL

```sql
-- Rimuove il constraint legacy che blocca 'single_lesson'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS payment_kind_check;
```

## Cosa cambia

- `finalize_booking_request` potrà inserire `kind = 'single_lesson'` senza errori
- I constraint `chk_order_kind` e `chk_order_kind_refs` continuano a validare i dati correttamente
- Nessun impatto su dati esistenti

## Verifiche Post-Implementazione

- Coach può approvare richieste di appuntamento `single_paid`
- Coach può inviare controproposte
- Ordine viene creato con `kind = 'single_lesson'` e `event_id` valorizzato

## Sezione Tecnica

### Architettura `orders.kind`

| Valore | Uso | FK richiesta |
|--------|-----|--------------|
| `single_lesson` | Lezione singola a pagamento | `event_id` NOT NULL |
| `package_purchase` | Acquisto pacchetto | `package_id` NOT NULL |

### File impattati

Solo migration SQL - nessuna modifica al codice frontend o alle funzioni RPC.

