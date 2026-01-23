

# Fix: Nomi Esercizi Mancanti nello Storico Sessioni

## Diagnosi

Il cambio piano **NON ha corrotto i dati storici** - lo snapshot contiene correttamente i nomi degli esercizi. Il problema è un **bug nel codice di lettura** che non riconosce il nuovo formato dello snapshot.

### Root Cause

```typescript
// ❌ Cerca snapshot.day_structure (formato LEGACY)
let exerciseName = snapshot?.day_structure 
  ? findExerciseNameFromDayStructure(snapshot.day_structure, actual.exercise_id)
  : null;
```

Ma lo snapshot ha formato NUOVO:
```json
{
  "day": { "id": "...", "title": "Giorno 1" },
  "phases": [...]  // ← Dati QUI, non in day_structure
}
```

---

## Soluzione

### 1. Aggiornare `groupActualsByExercise` in ClientSessionDetailSheet.tsx

Supportare entrambi i formati dello snapshot:

```typescript
function groupActualsByExercise(
  actuals: ExerciseActual[],
  snapshot: PlanDaySnapshot | null,
  plan: ClientActivePlan | null | undefined
): GroupedActuals[] {
  const groups: Record<string, GroupedActuals> = {};

  for (const actual of actuals) {
    if (!groups[actual.exercise_id]) {
      let exerciseName: string | null = null;
      
      // 1. NEW FORMAT: snapshot.phases (from buildPlanDaySnapshot)
      if (snapshot?.phases) {
        for (const phase of snapshot.phases) {
          for (const group of phase?.groups || []) {
            const found = group?.exercises?.find((e: any) => e.id === actual.exercise_id);
            if (found?.name) {
              exerciseName = found.name;
              break;
            }
          }
          if (exerciseName) break;
        }
      }
      
      // 2. LEGACY FORMAT: snapshot.day_structure.phases
      if (!exerciseName && snapshot?.day_structure) {
        exerciseName = findExerciseNameFromDayStructure(snapshot.day_structure, actual.exercise_id);
      }
      
      // 3. FALLBACK: active plan (for very old sessions without snapshot)
      if (!exerciseName && plan?.data?.days) {
        // ... existing fallback logic
      }

      // 4. FINAL FALLBACK: generic name
      if (!exerciseName) {
        exerciseName = `Esercizio ${actual.exercise_id.slice(0, 8)}`;
      }
      
      // ...
    }
  }
}
```

### 2. Aggiungere helper dedicato in countExercisesFromDayStructure.ts

```typescript
/**
 * Finds exercise name from new snapshot format (with phases at root level)
 */
export function findExerciseNameFromPhases(phases: any[], exerciseId: string): string | null {
  if (!Array.isArray(phases)) return null;
  for (const phase of phases) {
    for (const group of phase?.groups || []) {
      const found = group?.exercises?.find((e: any) => e.id === exerciseId);
      if (found?.name) return found.name;
    }
  }
  return null;
}
```

### 3. Aggiornare il tipo PlanDaySnapshot

Assicurarsi che il tipo includa entrambi i formati:

```typescript
export type PlanDaySnapshot = {
  // Legacy format
  day_structure?: any;
  day_title?: string;
  
  // New format  
  day?: { id: string; order: number; title: string };
  phases?: any[];
  
  // Common
  captured_at?: string;
  plan_id?: string;
  plan_name?: string;
  warning?: string;
};
```

---

## File da modificare

| File | Azione |
|------|--------|
| `src/features/client-workouts/components/ClientSessionDetailSheet.tsx` | Fix logica lettura snapshot |
| `src/features/client-workouts/utils/countExercisesFromDayStructure.ts` | Aggiungere `findExerciseNameFromPhases` |
| `src/features/client-workouts/api/client-sessions.api.ts` | Verificare tipo già corretto |

---

## Risultato Atteso

Dopo il fix, la sessione del 21 gennaio mostrerà:
- **Panca piana** (invece di "Esercizio b41c114e")
- **Trazioni zavorrate** (invece di "Esercizio 8f9de2d2")
- Gli altri 2 esercizi rimarranno generici perché avevano nome vuoto nel piano originale

---

## Nota sulla Data Quality

Due esercizi nello snapshot originale hanno `name: ""`. Questo non è un bug del sistema di snapshot ma un problema di data quality nel piano originale al momento della creazione della sessione.

