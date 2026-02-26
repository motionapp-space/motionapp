

## Analisi completata

Ho verificato lo stato attuale del DB:
- **`finalize_booking_request`**: riga 226 usa `'single_session'` (errato), riga 232 usa `'pending'` (errato)
- **`chk_order_kind_refs`**: contiene valori legacy `charge`, `refund`, `deposit` — zero righe in DB con questi valori, quindi safe da rimuovere
- **`chk_order_kind`**: già corretto (`single_lesson`, `package_purchase`)
- **`chk_order_status`**: già corretto (`draft`, `due`, `paid`, `canceled`, `refunded`, `refund_pending`)

## Migration SQL

Una singola migration con 2 interventi:

### 1. Ricreare `finalize_booking_request`
Identica alla versione corrente ma con 2 fix:
- `kind = 'single_session'` → `'single_lesson'`
- `status = 'pending'` → `'draft'`

### 2. Allineare `chk_order_kind_refs`
Rimuovere i 3 valori legacy mai raggiungibili:
```sql
ALTER TABLE orders DROP CONSTRAINT chk_order_kind_refs;
ALTER TABLE orders ADD CONSTRAINT chk_order_kind_refs CHECK (
  (kind = 'single_lesson' AND event_id IS NOT NULL AND package_id IS NULL)
  OR (kind = 'package_purchase' AND package_id IS NOT NULL AND event_id IS NULL)
);
```

Nessuna modifica al codice frontend. Fix interamente nel DB.

