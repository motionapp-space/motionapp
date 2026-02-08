

## Aggiornare il corpo testo nell'app cliente da 14px a 15px

### Obiettivo
Aumentare la leggibilità del testo standard nell'app cliente (ottimizzata per mobile) portando il corpo testo da `text-sm` (14px) a `text-[15px] leading-6` (15px con line-height 24px).

### Ambito
Solo i componenti dell'app cliente. I file del coach/trainer non vengono toccati.

### File coinvolti

**Componenti client condivisi** (`src/components/client/`):
1. `ClientPageHeader.tsx` — descrizione sotto il titolo
2. `ClientEmptyState.tsx` — descrizione dello stato vuoto
3. `ClientHistoryItem.tsx` — titolo dell'elemento
4. `ClientSessionLayout.tsx` — testo "account non collegato"
5. `ClientAppLayout.tsx` — testo "account non collegato"
6. `ClientUserMenu.tsx` — nome utente, email, telefono

**Pagine client** (`src/pages/client/`):
7. `ClientAcceptInvite.tsx` — testi del form di invito
8. `ClientAllAppointments.tsx` — orari e descrizioni
9. `ClientLiveSession.tsx` — testi della sessione live (target, serie, recupero, durata, azioni)
10. `ClientNotifications.tsx` (se contiene text-sm)

**Feature client-workouts** (`src/features/client-workouts/components/`):
11. `ActivePlanCard.tsx` — sottotitolo giorni
12. `ClientWorkoutExerciseList.tsx` — nome esercizio, messaggi vuoto
13. `NextWorkoutCTA.tsx` — link "Cambia giorno"
14. `SessionHistoryCard.tsx` — titolo sessione
15. `PlanOverviewSheet.tsx` — sottotitoli e nomi giorni
16. `ChangeDaySheet.tsx` — dettagli giorno
17. `NextWorkoutCard.tsx` — sottotitoli
18. `ClientWorkoutDayCard.tsx` — titolo giorno
19. `ClientSessionDetailSheet.tsx` — dettagli esercizio, azioni

**Feature client-bookings** (`src/features/client-bookings/components/`):
20. `BookingCTA.tsx` — messaggio disabilitato
21. `CounterProposalBanner.tsx` — orario originale
22. `AppointmentsList.tsx` — messaggi vuoto
23. `PaymentCoverageSection.tsx` — titoli e nomi pacchetti
24. `NextAppointmentCard.tsx` — data, orario, sottotitolo
25. `CounterProposalCard.tsx` — orario e label
26. `AppointmentDetailSheet.tsx` — dettagli appuntamento
27. `PendingRequestCard.tsx` — orario

### Regola di sostituzione

Per ogni file sopra elencato, sostituire le occorrenze di `text-sm` che rappresentano **corpo testo leggibile** con `text-[15px] leading-6`.

**Non verranno toccati:**
- `text-xs` (12px) — label e microcopy, restano invariati
- `text-[13px]` — caption/subtitle, restano invariati
- `text-sm` usato su **bottoni** o **badge** (elementi UI, non corpo testo)
- `text-sm` nei componenti del coach/trainer

### Dettaglio tecnico

Esempio di trasformazione:
```
// Prima
<p className="text-sm text-muted-foreground">descrizione</p>

// Dopo
<p className="text-[15px] leading-6 text-muted-foreground">descrizione</p>
```

La scala tipografica dell'app cliente diventa:
| Elemento | Prima | Dopo |
|---|---|---|
| Titolo pagina | 19px | 19px (invariato) |
| Titolo sezione/card | 17px | 17px (invariato) |
| Corpo testo | 14px | **15px + leading-6** |
| Caption/subtitle | 13px | 13px (invariato) |
| Label/micro | 12px | 12px (invariato) |

