

## Dettaglio sessione storica: rendering strutturato (versione bulletproof)

Piano completo con tutti i micro-fix richiesti integrati.

---

### File da modificare

#### File 1: `src/features/session-tracking/utils/translatePhaseType.ts` (nuovo)

Helper condiviso con guard falsy e normalizzazione robusta:

```ts
export function translatePhaseType(phaseType: string | undefined | null): string {
  if (!phaseType) return '';
  const key = phaseType.toLowerCase().replace(/[_-]/g, ' ').trim();
  switch (key) {
    case 'warm up':
    case 'warmup':
      return 'Riscaldamento';
    case 'main':
    case 'main workout':
      return 'Corpo principale';
    case 'cooldown':
    case 'cool down':
      return 'Defaticamento';
    case 'stretching':
      return 'Stretching';
    default:
      return phaseType;
  }
}
```

#### File 2: `src/pages/client/ClientLiveSession.tsx`

- Rimuovere la funzione locale `translatePhaseType`
- Importare da `@/features/session-tracking/utils/translatePhaseType`

#### File 3: `src/features/client-workouts/components/ClientSessionDetailSheet.tsx`

**A) Pre-compute Map actuals**

```ts
const actualsMap = new Map<string, ExerciseActual[]>();
for (const a of allActuals) {
  const arr = actualsMap.get(a.exercise_id) || [];
  arr.push(a);
  actualsMap.set(a.exercise_id, arr);
}
actualsMap.forEach(arr => arr.sort((a, b) => a.set_index - b.set_index));
```

**B) Rendering strutturato** (quando `snapshot?.phases && snapshot.phases.length > 0`)

Iterare `phases > groups > exercises` dallo snapshot:

- **Fase**: prima calcolare quanti esercizi nella fase hanno actuals. Se 0 -> `return null` (niente header, niente contenuto). Se > 0 -> renderizzare titolo + contenuto.
  - Classi titolo: `mt-6 first:mt-0 pb-2 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/40`
- **Gruppo superset/circuit**: contare esercizi completati (`actualsMap.get(exId)?.length > 0`). Se completati >= 2 -> badge + rail. Se < 2 -> rendering diretto, nessun wrapper.
  - Badge label da `group.type`: `superset` -> "Superset", `circuit` -> "Circuito", altro -> niente
  - Classi wrapper: `mt-3 border-l-2 border-primary/30 pl-3`
  - Badge: `text-xs font-medium text-primary/70 mb-1`
- **Gruppo single**: rendering diretto, classi `mt-3`
- **Esercizio senza actuals nella Map**: saltato
- **ExerciseDetail**: `py-3 border-b border-border/50 last:border-0` (invariato)

**C) Fallback legacy**

```ts
// Legacy rendering: keep unchanged, do not refactor.
// Used for sessions without snapshot phases data.
```

Se `!snapshot?.phases || snapshot.phases.length === 0` -> usa `groupActualsByExercise` esistente (lista piatta, invariata).

**D) Componenti interni**

- `SetLine` — invariato
- `ExerciseDetail` — riceve `{ name: string, sets: ExerciseActual[] }`, invariato nella sostanza
- Logica di fase e gruppo inline o come sotto-componenti interni al file

---

### Checklist finale

- [x] `translatePhaseType` con guard falsy (`if (!phaseType) return ''`)
- [x] Normalizzazione robusta (lowercase + replace separatori + trim)
- [x] Helper estratto e condiviso tra LiveSession e DetailSheet
- [x] Pre-compute `Map` per O(1) lookup
- [x] Sort actuals per `set_index` (non-nullable, sort sicuro)
- [x] Fase: calcolo completati PRIMA di renderizzare header
- [x] Declassamento gruppi basato su esercizi completati (non totali)
- [x] Label gruppo da `group.type` (non da `group.label`)
- [x] Spacing esplicito: `mt-6 first:mt-0` fasi, `mt-3` gruppi
- [x] Fallback legacy con commento "do not refactor"
- [x] Ordinamento snapshot preservato (nessun re-sort)
- [x] 3 file totali (1 nuovo, 2 modificati), impatto isolato

