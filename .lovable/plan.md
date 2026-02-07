

# Conversione titoli eventi: "Allenamento" / "Sessione di allenamento" → "Appuntamento"

## Problema

I titoli di default degli eventi usano termini incoerenti:

| Dove | Titolo attuale |
|------|---------------|
| Coach crea evento (EventEditorModal) | `"Allenamento"` |
| Client prenota (ClientAppointmentModal) | `"Sessione di allenamento"` |
| Booking request approvata (RPC SQL) | `"Appuntamento con [nome]"` (OK) |

La terminologia del progetto prevede che gli eventi in calendario siano **appuntamenti**, non allenamenti o sessioni.

## Soluzione

Sostituire tutti i default con `"Appuntamento"`.

### File 1: `src/features/events/components/EventEditorModal.tsx`

Cambiare `'Allenamento'` in `'Appuntamento'` in 4 punti:
- Riga 155: stato iniziale del form
- Riga 254: reset form per nuovo evento
- Riga 278: fallback titolo in edit mode (then)
- Riga 290: fallback titolo in edit mode (catch)

Anche riga 644 (log ricorrenza): `'Allenamento'` → `'Appuntamento'`

### File 2: `src/features/events/components/ClientAppointmentModal.tsx`

- Riga 113: `"Sessione di allenamento"` → `"Appuntamento"`

### Non modificati

- Riga 1036 di EventEditorModal (`"Puoi registrare l'allenamento anche se già svolto"`) rimane invariata: qui si parla della sessione di allenamento derivata dall'appuntamento, non del titolo dell'evento.
- RPC `finalize_booking_request`: gia usa `"Appuntamento con [nome]"`.
- Tutti i file fuori da `src/features/events/` che usano "allenamento" in contesto diverso (piani, sessioni, UI educativa) non vengono toccati.

## Riepilogo: 6 sostituzioni in 2 file

