
# Fix: Ricorrenza Mensile - Giorno del Mese Errato

## Problema Identificato

Quando si seleziona la frequenza "Mensile", l'anteprima mostra date errate:
- **Comportamento attuale**: 23 gen → 1 feb → 1 mar → 1 apr
- **Comportamento atteso**: 23 gen → 23 feb → 23 mar → 23 apr

### Root Cause

1. **Inizializzazione errata in `EventEditorModal.tsx` (riga 177)**:
   ```typescript
   monthDay: 1,  // ← Sempre 1, mai aggiornato
   ```

2. **Logica di generazione in `recurrence.ts` (righe 59-61)**:
   ```typescript
   if (config.monthDay) {
     nextDate.setDate(Math.min(config.monthDay, ...));
   }
   ```
   Poiché `monthDay = 1`, forza tutte le date al primo del mese.

---

## Soluzione

### Modifica 1: Auto-impostare monthDay quando si cambia frequenza a "monthly"

**File**: `src/features/events/components/RecurrenceSection.tsx`

Aggiungere un `useEffect` che imposta automaticamente `monthDay` al giorno della `startDate` quando la frequenza diventa "monthly":

```typescript
// Auto-imposta monthDay quando la frequenza cambia a "monthly"
useEffect(() => {
  if (config.frequency === "monthly" && config.enabled) {
    const dayOfMonth = startDate.getDate();
    if (config.monthDay !== dayOfMonth) {
      updateConfig({ monthDay: dayOfMonth });
    }
  }
}, [config.frequency, config.enabled, startDate]);
```

### Modifica 2: Rimuovere l'inizializzazione hardcoded

**File**: `src/features/events/components/EventEditorModal.tsx`

Cambiare l'inizializzazione di `monthDay` da `1` a `undefined`:

```typescript
const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
  enabled: false,
  frequency: "weekly",
  interval: 1,
  weekDays: [],
  monthDay: undefined,  // ← Non hardcodato a 1
  endType: "count",
  endDate: undefined,
  occurrenceCount: 4
});
```

### Modifica 3: Migliorare la logica di generazione per i mesi con meno giorni

**File**: `src/features/events/utils/recurrence.ts`

Attualmente la logica gestisce già i mesi con meno giorni:
```typescript
nextDate.setDate(Math.min(config.monthDay, lastDayOfMonth));
```

Ma quando `monthDay` è `undefined`, `addMonths` di date-fns già fa la cosa giusta. Bisogna rimuovere il comportamento con `monthDay = 1`:

```typescript
case "monthly":
  nextDate = addMonths(currentDate, interval);
  // Se monthDay è impostato (per ricorrenze tipo "ogni mese il 15"),
  // forza quel giorno (gestendo mesi corti)
  if (config.monthDay && config.monthDay > 0) {
    const lastDayOfMonth = new Date(
      nextDate.getFullYear(), 
      nextDate.getMonth() + 1, 
      0
    ).getDate();
    nextDate.setDate(Math.min(config.monthDay, lastDayOfMonth));
  }
  // Se monthDay non è impostato, addMonths già mantiene il giorno originale
  // e gestisce i mesi corti automaticamente
  break;
```

---

## Comportamento con Mesi Corti (es. 31 gennaio)

`addMonths` di date-fns gestisce automaticamente questi casi:
- 31 gen + 1 mese = 28/29 feb (ultimo giorno disponibile)
- 31 gen + 2 mesi = 31 mar
- 31 gen + 3 mesi = 30 apr (ultimo giorno disponibile)

Se l'utente vuole forzare un giorno specifico (es. "sempre il 31"), la logica `Math.min(monthDay, lastDayOfMonth)` garantisce:
- Marzo: 31
- Aprile: 30 (fallback all'ultimo giorno)
- Febbraio: 28/29 (fallback all'ultimo giorno)

---

## File da Modificare

| File | Azione |
|------|--------|
| `src/features/events/components/RecurrenceSection.tsx` | Aggiungere useEffect per auto-impostare monthDay |
| `src/features/events/components/EventEditorModal.tsx` | Cambiare `monthDay: 1` → `monthDay: undefined` |
| `src/features/events/utils/recurrence.ts` | Migliorare condizione per non forzare monthDay=1 |

---

## Risultato Atteso

### Prima (bug)
- 23 gen → **1 feb** → **1 mar** → **1 apr**

### Dopo (fix)
- 23 gen → **23 feb** → **23 mar** → **23 apr**

### Con data 31 gennaio
- 31 gen → **28 feb** → **31 mar** → **30 apr**
