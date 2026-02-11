

## Target completi, recupero gruppo e notes/goal nella sessione client

Piano finale — tutte le incoerenze risolte.

---

### Convenzioni fissate (definitive)

- **Separatore**: sempre ` · ` (middle dot, U+00B7) — in testo e codice
- **Moltiplicazione**: sempre `×` (multiplication sign, U+00D7) — non "x"
- **Formatter**: `formatRestTime` da `src/features/session-tracking/utils/formatters.ts`, gia' importato in `ClientLiveSession.tsx` (riga 32)
- **Target single**: `{sets} serie × {reps} rip · {load} · Rec {MM:SS}` — solo campi presenti, no "Rec 00:00", degradazione elegante
- **Header superset/circuit**: `{targetSets} serie · Rec {MM:SS}`
- **Notes prima (italic, mt-1), goal dopo (normale, mt-0.5)**
- **Timer**: helper `getGroupRestSeconds()` per leggibilita'

### Nota semantica (future-proof)

`sharedRestBetweenExercises` e `restBetweenRounds` nel codebase rappresentano entrambi "rest after group/round completion", non rest tra esercizi interni al gruppo. Mappati entrambi a `group_rest_seconds` nello snapshot.

---

### File 1: `src/features/session-tracking/core/types.ts`

**SnapshotGroup** — aggiungere:
```ts
group_rest_seconds?: number;  // rest dopo completamento round (superset/circuit)
target_sets?: number;         // superset: sharedSets, circuit: rounds
```

**SnapshotExercise** — aggiungere:
```ts
load?: string;
notes?: string;
goal?: string;
```

---

### File 2: `src/features/session-tracking/core/snapshot.ts`

**`mapGroup()`** — popolare i nuovi campi:
```ts
function mapGroup(group: ExerciseGroup): SnapshotGroup {
  const result: SnapshotGroup = {
    id: group.id,
    type: group.type,
    label: group.name,
    exercises: (group.exercises || []).map(mapExercise),
  };
  if (group.type === 'superset') {
    result.group_rest_seconds = parseRestToSeconds(group.sharedRestBetweenExercises);
    result.target_sets = group.sharedSets;
  } else if (group.type === 'circuit') {
    result.group_rest_seconds = parseRestToSeconds(group.restBetweenRounds);
    result.target_sets = group.rounds;
  }
  return result;
}
```

**`mapExercise()`** — aggiungere load, notes, goal:
```ts
function mapExercise(exercise: Exercise): SnapshotExercise {
  return {
    id: exercise.id,
    name: exercise.name || '',
    sets: exercise.sets || 0,
    reps: exercise.reps || '',
    rest_seconds: parseRestToSeconds(exercise.rest),
    load: exercise.load || undefined,
    notes: exercise.notes || undefined,
    goal: exercise.goal || undefined,
  };
}
```

---

### File 3: `src/pages/client/ClientLiveSession.tsx`

#### A) Helper `getGroupRestSeconds` (nuovo, sopra GroupCard)

```ts
function getGroupRestSeconds(group: SnapshotGroup): number {
  if (group.type !== 'single' && group.group_rest_seconds != null) {
    return group.group_rest_seconds;
  }
  if (group.type !== 'single') {
    return Math.max(...group.exercises.map(e => e.rest_seconds ?? 0)) || 60;
  }
  return group.exercises[0]?.rest_seconds || 60;
}
```

#### B) ExerciseBlock — prop `isSingle` + target line con degradazione + notes/goal

Aggiungere `isSingle: boolean` alle props.

Target line con degradazione elegante e separatori consistenti:

```ts
let targetDisplay: string;
if (isSingle) {
  const parts: string[] = [];
  if (exercise.sets > 0 && exercise.reps) {
    parts.push(`${exercise.sets} serie × ${exercise.reps} rip`);
  } else if (exercise.sets > 0) {
    parts.push(`${exercise.sets} serie`);
  } else if (exercise.reps) {
    parts.push(`${exercise.reps} rip`);
  }
  if (exercise.load) parts.push(exercise.load);
  if (exercise.rest_seconds && exercise.rest_seconds > 0) {
    parts.push(`Rec ${formatRestTime(exercise.rest_seconds)}`);
  }
  targetDisplay = parts.length > 0 ? parts.join(' · ') : 'Target';
} else {
  targetDisplay = exercise.reps
    ? `Target · ${exercise.reps} rip`
    : `Target · ${exercise.sets} serie`;
}
```

Notes e goal sotto la riga target:

```tsx
{exercise.notes && (
  <p className="text-xs text-muted-foreground italic mt-1">{exercise.notes}</p>
)}
{exercise.goal && (
  <p className="text-xs text-muted-foreground mt-0.5">{exercise.goal}</p>
)}
```

#### C) GroupCard — timer con helper

```ts
const restSeconds = getGroupRestSeconds(group);
```

#### D) GroupCard — targetSeries con fallback

```ts
const targetSeries = group.target_sets ?? Math.min(...group.exercises.map(e => e.sets));
```

#### E) Passare `isSingle` a ExerciseBlock

```tsx
<ExerciseBlock
  ...props esistenti...
  isSingle={group.type === 'single'}
/>
```

#### F) Header gruppo — info sotto titolo superset/circuit

```tsx
{groupTypeLabel ? (
  <div>
    <div className="text-sm font-medium text-foreground">
      {groupTypeLabel}
    </div>
    <p className="text-xs text-muted-foreground mt-0.5">
      {currentFlatGroup.group.target_sets
        ?? Math.min(...currentFlatGroup.group.exercises.map(e => e.sets))
      } serie · Rec {formatRestTime(
        currentFlatGroup.group.group_rest_seconds
          ?? Math.max(...currentFlatGroup.group.exercises.map(e => e.rest_seconds ?? 0))
          || 60
      )}
    </p>
  </div>
) : (
  <span />
)}
```

#### G) SeriesBadge header

```ts
const targetSeries = group.target_sets ?? Math.min(...group.exercises.map(e => e.sets));
```

---

### Compatibilita' sessioni esistenti

Tutti i nuovi campi opzionali con fallback:
- `target_sets` assente: `Math.min(exercises.sets)`
- `group_rest_seconds` assente: `Math.max(exercises.rest_seconds)` o 60
- `load/notes/goal` assenti: non mostrati

Nessuna migrazione DB. Nuove sessioni avranno snapshot completo.

---

### Checklist

- [x] Separatore ` · ` (middle dot) consistente ovunque
- [x] Moltiplicazione `×` consistente ovunque
- [x] `formatRestTime` gia' importato — nessun nuovo formatter
- [x] Un solo `group_rest_seconds` — no ambiguita'
- [x] `target_sets` con fallback `min(exercises.sets)`
- [x] Timer usa `getGroupRestSeconds()` helper leggibile
- [x] Single: degradazione elegante se sets/reps mancanti, no "Rec 00:00"
- [x] Superset/circuit header: serie target + recupero gruppo
- [x] Notes (italic, mt-1) prima, goal (normale, mt-0.5) dopo
- [x] Sessioni esistenti non rotte

