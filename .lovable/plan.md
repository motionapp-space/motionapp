

## Standardizzare il titolo degli eventi a "Appuntamento"

### Obiettivo
Tutti gli eventi/appuntamenti creati nel sistema devono avere il titolo fisso **"Appuntamento"**, eliminando varianti come "Appuntamento con [Nome]" o titoli personalizzati dal coach.

### Modifiche necessarie

**1. `src/features/events/components/EventEditorModal.tsx`**
- Rimuovere il campo titolo dal form (non piu' modificabile dal coach)
- Impostare il titolo fisso a `"Appuntamento"` nella logica di submit
- Rimuovere la logica che genera "Appuntamento con [nome cliente]" al cambio cliente

**2. `src/features/events/components/ClientAppointmentModal.tsx`**
- Gia' usa `"Appuntamento"` — nessuna modifica necessaria

**3. `supabase/functions/_shared/` o migrazione SQL — `finalize_booking_request`**
- Modificare la funzione RPC `finalize_booking_request` che attualmente genera il titolo come `'Appuntamento con ' || v_client_name`
- Cambiare in titolo fisso `'Appuntamento'`

**4. `src/features/client-bookings/api/client-bookings.api.ts`**
- Il fallback `event.title || 'Appuntamento'` resta corretto — nessuna modifica necessaria
- Il titolo `'Richiesta appuntamento'` per le booking request in attesa resta corretto

### Dettaglio tecnico

**EventEditorModal.tsx** — rimuovere il campo titolo dal JSX e forzare il valore:
```tsx
// Rimuovere dal form il campo <Input> per il titolo
// Nel submit, usare sempre:
title: "Appuntamento"
```

**Migrazione SQL** per `finalize_booking_request`:
```sql
-- Dentro la funzione, cambiare la riga:
--   v_title := 'Appuntamento con ' || v_client_name;
-- in:
v_title := 'Appuntamento';
```

### File coinvolti
| File | Azione |
|---|---|
| `src/features/events/components/EventEditorModal.tsx` | Rimuovere campo titolo, forzare "Appuntamento" |
| Migrazione SQL `finalize_booking_request` | Cambiare titolo generato da "Appuntamento con X" a "Appuntamento" |

### Note
- Gli eventi gia' esistenti nel database manterranno il titolo attuale. Se si vuole uniformare anche quelli, servira' un UPDATE separato.
- Il titolo "Richiesta appuntamento" mostrato nella vista client per le booking request in attesa non cambia (non e' un evento a calendario).

