

# Fix ordinamento temporale slot alternativi

## Problema

La funzione `findNearestSlots` in `src/features/bookings/utils/slot-generator.ts` (riga 180) restituisce i 3 slot piu vicini ordinati per **distanza temporale** dalla richiesta originale, non in **ordine cronologico**.

Esempio con richiesta alle 13:00:
- Distanza minore: 12:00 (1h)
- Seconda: 14:00 (1h)
- Terza: 11:00 (2h)

Risultato attuale: 12:00, 14:00, 11:00 (per distanza)
Risultato corretto: 11:00, 12:00, 14:00 (cronologico)

## Soluzione

Una modifica di una sola riga nel file `src/features/bookings/utils/slot-generator.ts`, riga 180:

```typescript
// Prima
return sorted.slice(0, 3).map(s => s.slot);

// Dopo
return sorted.slice(0, 3).map(s => s.slot).sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
```

Seleziona i 3 slot piu vicini per distanza (logica invariata), poi li riordina cronologicamente per la visualizzazione.

## Impatto

- `BookingRequestDrawer.tsx`: gli slot alternativi nel drawer di approvazione saranno in ordine cronologico
- `CounterProposeDialog.tsx`: anche gli slot suggeriti nel dialog di controproposta beneficeranno dello stesso fix

Nessun altro file da modificare.
