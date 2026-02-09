

## Fix: Due sessioni nello stesso giorno contate come una sola

### Problema

`useWeeklyProgress` conta le sessioni completate usando un `Set<number>` basato sull'**indice del giorno della settimana** (lunedi=0, martedi=1, ecc.). Se due sessioni avvengono lo stesso giorno (es. una autonoma e una con il coach), il Set le deduplica e ne conta solo una.

Nel caso specifico di Draco Malfoy:
- Sessione autonoma completata lunedi 9 Feb alle 22:21
- Sessione con il coach completata lunedi 9 Feb alle 22:28
- Entrambe mappano a indice `0` (lunedi) -> il Set conta 1 invece di 2

### Soluzione

Cambiare la logica di conteggio in `useWeeklyProgress.ts`: invece di contare i **giorni unici** con almeno una sessione, contare il **numero totale di sessioni completate** questa settimana.

### Dettaglio tecnico

**File: `src/features/client-workouts/hooks/useWeeklyProgress.ts`**

Sostituire il calcolo basato su `completedWeekDayIndices` (Set di indici giorno) con un semplice conteggio delle sessioni completate nella settimana:

```typescript
// PRIMA (buggy): conta giorni unici della settimana
const completedWeekDayIndices = new Set<number>(
  (sessions || [])
    .filter(...)
    .map((s) => {
      const jsDay = sessionDate.getDay();
      return jsDay === 0 ? 6 : jsDay - 1;
    })
);
const completedCount = completedWeekDayIndices.size;

// DOPO (corretto): conta il numero totale di sessioni completate
const thisWeekSessions = (sessions || []).filter((s) => {
  if (!s.started_at) return false;
  const sessionDate = new Date(s.started_at);
  return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
});
const completedCount = thisWeekSessions.length;
```

Per la visualizzazione dei pallini dei giorni della settimana (`weekDays`), mantenere il Set degli indici solo per determinare `isCompleted` su ogni giorno:

```typescript
// Set per i pallini (visualizzazione)
const completedWeekDayIndices = new Set<number>(
  thisWeekSessions.map((s) => {
    const sessionDate = new Date(s.started_at!);
    const jsDay = sessionDate.getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  })
);
```

Questo separa due concetti:
- **completedCount**: numero totale di sessioni (per la progress bar e il contatore X/Y)
- **completedWeekDayIndices**: giorni unici con sessioni (per i pallini della settimana)

### File coinvolti

| File | Azione |
|---|---|
| `src/features/client-workouts/hooks/useWeeklyProgress.ts` | Separare conteggio sessioni da visualizzazione giorni |

