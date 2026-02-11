

## Review gerarchie font e spaziature (Notion rhythm)

### Stato attuale vs richiesto

| Elemento | Attuale | Richiesto | File |
|----------|---------|-----------|------|
| Fase header (Riscaldamento...) | `text-sm font-medium` | `text-sm font-semibold` | PhaseSectionCompact L115 |
| Titolo esercizio | `text-sm font-medium` | `text-sm font-medium` (ok) | ExerciseRowCompact L83/89 |
| Day header -> prima fase | `mt-4` | `mt-4` (ok) | DayCardCompact L173 |
| Fase header -> lista esercizi | `space-y-3` (container) | `mt-2` tra header e lista | PhaseSectionCompact L112/181 |
| Riga esercizio (desktop) | `py-1.5` | `py-3` | ExerciseRowCompact L65 |
| Riga esercizio (mobile) | `py-2` | `py-3` | ExerciseRowCompact L200 |
| CTA "Aggiungi esercizio" | `mt-2` | `mt-3` | PhaseSectionCompact L250 |

### Modifiche

**File 1: `src/components/plan-editor/PhaseSectionCompact.tsx`**

- L112: cambiare `space-y-3` in `space-y-2` (tighter: header->contenuto = mt-2 implicito)
- L115: cambiare `font-medium` in `font-semibold` (gerarchia fase)
- L250: cambiare `mt-2` in `mt-3` (CTA spacing)

**File 2: `src/components/plan-editor/ExerciseRowCompact.tsx`**

- L65 (desktop row): cambiare `py-1.5` in `py-3`
- L200 (mobile row): cambiare `py-2` in `py-3`

Nessun altro file toccato. Titolo esercizio e day->fase gia' corretti.
