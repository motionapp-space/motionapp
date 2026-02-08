

## Ridurre l'altezza dello SlotSelectorSheet su mobile

### Problema
Il foglio "Prenota appuntamento" (`SlotSelectorSheet`) si apre con `h-[90vh]` (90% dell'altezza dello schermo), coprendo quasi tutto il display del telefono e dando l'impressione di un'apertura a tutto schermo.

### Soluzione
Ridurre l'altezza del foglio e renderla adattiva al contenuto, mantenendo un limite massimo ragionevole.

### Dettagli tecnici

**File: `src/features/client-bookings/components/SlotSelectorSheet.tsx`**

Modificare la classe CSS di `SheetContent` alla riga 165:

- **Attuale**: `h-[90vh]` (altezza fissa al 90% dello schermo)
- **Nuovo**: `h-[75vh]` (altezza fissa al 75% dello schermo)

Questo lascia visibile una porzione significativa della pagina sottostante, rendendo chiaro che si tratta di un pannello sovrapposto e non di una pagina a tutto schermo. Il pattern e' coerente con l'`AppointmentDetailSheet` che usa `max-h-[80vh]`.

