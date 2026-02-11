

## Spaziature precise - Dettaglio Giorno

Applicazione della mappa spaziature fornita, solo classi Tailwind, nessuna modifica a logica/struttura.

### Mappa spaziature di riferimento

```text
Header -> prima sezione:       mb-6
Label sezione -> primo esercizio: mb-3
Tra esercizi:                   mb-4
Titolo -> meta:                 mt-1
Meta -> note:                   mt-1
Superset label:                 mt-3 mb-1
Nuova sezione:                  mt-6 pt-6 border-t
```

### File 1: `WorkoutDayDetailSheet.tsx`

| Riga | Attuale | Nuovo |
|------|---------|-------|
| 32 | `h-[75vh] rounded-t-2xl flex flex-col` | `h-[75vh] rounded-t-2xl flex flex-col px-5 py-6` |
| 33 | `text-left pb-4 border-b shrink-0` | `text-left pb-4 border-b shrink-0 mb-6` |
| 39 | `text-lg` | `text-[22px] font-semibold tracking-tight leading-snug` |
| 40 | `text-[15px] leading-6 text-muted-foreground` | `text-sm font-medium text-muted-foreground mt-1` |

- `mb-6` sull'header produce la spaziatura "Header -> prima sezione"
- `px-5 py-6` sul container per 20px/24px mobile padding
- Titolo e sottotitolo aggiornati tipograficamente (dal piano approvato precedente)

### File 2: `ClientWorkoutExerciseList.tsx`

**Import aggiunto** (riga 1): `import { cn } from "@/lib/utils";`

**ExerciseItem** (riga 21):
- Da: `py-2 border-b border-border/50 last:border-0`
- A: `mb-4 last:mb-0`
- Spacing tra esercizi = mb-4, rimossi i border-b

**Titolo esercizio** (riga 22):
- Da: `font-medium text-[15px] leading-6 text-foreground`
- A: `text-[17px] font-medium leading-snug tracking-[-0.01em] text-foreground/90`

**Meta riga** (riga 25):
- Da: `flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground`
- A: `flex flex-wrap gap-2 mt-1 text-[14px] font-normal text-muted-foreground`
- mt-1 confermato (Titolo -> meta)

**Note** (riga 31): mt-1 gia' presente, conforme

**Superset/Circuit label** (riga 46):
- Da: `text-xs font-medium text-primary mb-1`
- A: `text-xs font-semibold text-primary mt-3 mb-1`

**PhaseSection** (riga 57): aggiungere prop `isFirst: boolean`

Wrapper (riga 64):
- Da: `space-y-2`
- A: `cn("space-y-3", !isFirst && "border-t pt-6 mt-6")`
- Prima fase: solo `space-y-3`; successive: `mt-6 pt-6 border-t`

**Phase label h4** (riga 65):
- Da: `text-xs font-semibold uppercase tracking-wide text-muted-foreground`
- A: `text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3`
- `mb-3` = "Label sezione -> primo esercizio"

**Gruppi container** (riga 68):
- Da: `space-y-1`
- A: `space-y-0` (spacing ora gestito da mb-4 su ogni ExerciseItem)

**Root map** (riga 89):
- Da: `space-y-4`
- A: `space-y-0` (spacing gestito internamente da mt-6 sulle sezioni successive)

**Map call** (riga 90-92):
```tsx
{phases.map((phase, index) => (
  <PhaseSection key={phase.id} phase={phase} isFirst={index === 0} />
))}
```

### Checklist

- [x] Header -> prima sezione = mb-6
- [x] Label sezione -> primo esercizio = mb-3
- [x] Tra esercizi = mb-4
- [x] Titolo -> meta = mt-1
- [x] Meta -> note = mt-1
- [x] Superset = mt-3 mb-1
- [x] Nuova sezione = mt-6 pt-6 border-t
- [x] Container padding = px-5 py-6
- [x] Tipografia titolo/sottotitolo/label/esercizi aggiornata
- [x] Nessuna modifica a logica, stato, API, CTA, scroll
