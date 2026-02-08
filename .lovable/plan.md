
# Fix: Rimuovere toast duplicato nell'assegnazione piano

## Problema

Quando assegni un piano, appaiono due toast "Piano assegnato" perché il toast viene chiamato in **due punti diversi**:

| File | Riga | Codice |
|------|------|--------|
| `useAssignTemplate.ts` | 26 | `toast.success("Piano assegnato")` nell'`onSuccess` dell'hook |
| `AssignPlanDialog.tsx` | 45 | `toast.success("Piano assegnato")` dopo `await mutateAsync()` |

## Flusso attuale

```text
Click "Assegna" 
    → handleAssignAsIs() 
    → await assignMutation.mutateAsync()
        → [Backend risponde]
        → useAssignTemplate.onSuccess() → toast.success() ← TOAST #1
    → continua dopo await
    → toast.success() ← TOAST #2
```

## Soluzione

Rimuovere il toast duplicato da `AssignPlanDialog.tsx` (riga 45), mantenendo quello centralizzato nell'hook `useAssignTemplate`.

Questo approccio è preferibile perché:
- L'hook è il punto centrale per la logica di assegnazione
- Tutti i componenti che usano l'hook avranno lo stesso comportamento
- Evita duplicazioni future

## Modifica

**File**: `src/features/client-plans/components/AssignPlanDialog.tsx`

```typescript
// Da (righe 43-45):
      });

      toast.success("Piano assegnato");
      onOpenChange(false);

// A:
      });

      onOpenChange(false);
```

## Riepilogo

| Categoria | File |
|-----------|------|
| Componente | `src/features/client-plans/components/AssignPlanDialog.tsx` |
| **Totale** | **1 file** |
