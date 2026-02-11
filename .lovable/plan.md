

## Miglioramento tipografico e spaziature - Dettaglio Giorno (solo CSS/Tailwind)

Modifiche puramente visive su due file, nessun cambiamento a logica, stato o struttura.

### File 1: `WorkoutDayDetailSheet.tsx`

| Elemento | Attuale | Nuovo |
|---|---|---|
| `SheetContent` | `h-[75vh] rounded-t-2xl flex flex-col` | Aggiungere `px-5 py-6` (override del `p-6` base per avere 20px orizzontale) |
| `SheetHeader` | `text-left pb-4 border-b shrink-0` | `text-left pb-4 border-b shrink-0 mb-4` |
| `SheetTitle` | `text-lg` | `text-[22px] font-semibold tracking-tight leading-snug` |
| Sottotitolo "N esercizi" | `text-[15px] leading-6 text-muted-foreground` | `text-sm font-medium text-muted-foreground mt-1` |

### File 2: `ClientWorkoutExerciseList.tsx`

| Elemento | Attuale | Nuovo |
|---|---|---|
| **PhaseSection wrapper** | `space-y-2` | Prima fase: `space-y-3`, fasi successive: `border-t pt-6 mt-6 space-y-3` (gestito tramite prop `isFirst` o indice passato) |
| **Phase label (h4)** | `text-xs font-semibold uppercase tracking-wide` | `text-xs font-semibold uppercase tracking-wider text-muted-foreground` |
| **Spazio gruppi** | `space-y-1` | `space-y-1` (invariato) |
| **ExerciseItem wrapper** | `py-2 border-b border-border/50 last:border-0` | `mb-4 last:mb-0` (rimuove border-b, usa spacing) |
| **Titolo esercizio** | `font-medium text-[15px] leading-6 text-foreground` | `text-[17px] font-medium leading-snug tracking-[-0.01em] text-foreground/90` |
| **Meta riga** | `flex flex-wrap gap-2 mt-1 text-xs` | `flex flex-wrap gap-2 mt-1 text-[14px] font-normal text-muted-foreground` |
| **Note** | `text-xs text-muted-foreground mt-1 italic` | invariato (gia' conforme) |
| **Superset/Circuit label** | `text-xs font-medium text-primary mb-1` | `text-xs font-semibold text-primary mt-3 mb-1` |
| **Lista fasi (root)** | `space-y-4` | `space-y-0` (la spaziatura viene gestita da mt-6 sulle sezioni successive) |

Per distinguere la prima fase dalle successive senza aggiungere logica, si passa l'indice dalla `map` e si applica condizionalmente `border-t pt-6 mt-6` solo quando `index > 0`. Questo usa l'indice gia' disponibile nella `map`, senza aggiungere nuove prop o componenti.

### Dettaglio tecnico

**`ClientWorkoutExerciseList.tsx` - PhaseSection**: Riceve un prop `isFirst: boolean` (o si usa l'indice nel map). Nella `map` del `ClientWorkoutExerciseList`:

```tsx
{phases.map((phase, index) => (
  <PhaseSection key={phase.id} phase={phase} isFirst={index === 0} />
))}
```

PhaseSection applica:
```tsx
<div className={cn("space-y-3", !isFirst && "border-t pt-6 mt-6")}>
```

Questo richiede l'import di `cn` da `@/lib/utils` (gia' disponibile nel progetto, nessuna nuova dipendenza).

### Checklist

- [x] "Giorno 1" = 22px, semibold, tracking-tight
- [x] "9 esercizi" = text-sm, medium, muted
- [x] Section labels = xs, uppercase, tracking-wider
- [x] Exercise title = 17px, medium, tracking negativo, text-foreground/90
- [x] Meta = 14px, muted, mt-1
- [x] Spacing tra esercizi = mb-4
- [x] Spacing tra sezioni = mt-6, border-t su sezioni successive
- [x] Container padding mobile = px-5 py-6
- [x] Nessuna modifica a logica, stato, API, CTA, scroll behavior
