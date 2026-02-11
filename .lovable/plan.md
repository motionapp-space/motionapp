

## Fix: Scroll verticale bloccato nel WorkoutDayDetailSheet

### Problema

Il contenitore `SheetContent` ha altezza fissa (`h-[85vh]`) ma **non ha `flex flex-col`**. Di conseguenza:
- Il `div` con `overflow-y-auto flex-1` non puo' espandersi perche' `flex-1` funziona solo dentro un flex container
- Senza un'altezza vincolata, `overflow-y-auto` non attiva lo scroll
- Il bottone "Registra sessione" con `sticky bottom-0` potrebbe coprire gli ultimi esercizi

### Soluzione

Aggiungere `flex flex-col` al `SheetContent` e `min-h-0` al div scrollabile (necessario per evitare che flex items trabocchino).

### Modifiche

**File: `src/features/client-workouts/components/WorkoutDayDetailSheet.tsx`**

| Riga | Prima | Dopo |
|------|-------|------|
| 32 | `className="h-[85vh] rounded-t-2xl"` | `className="h-[75vh] rounded-t-2xl flex flex-col"` |
| 33 | `<SheetHeader className="text-left pb-4 border-b">` | `<SheetHeader className="text-left pb-4 border-b shrink-0">` |
| 53 | `<div className="overflow-y-auto flex-1 py-4">` | `<div className="overflow-y-auto flex-1 min-h-0 py-4">` |
| 57 | `<div className="sticky bottom-0 pt-4 pb-2 bg-background border-t">` | `<div className="shrink-0 pt-4 pb-2 bg-background border-t">` |

Dettagli:
- **`flex flex-col`** sul container: abilita il layout flex verticale cosi' `flex-1` funziona
- **`shrink-0`** su header e footer: impedisce che vengano compressi
- **`min-h-0`** sul div scrollabile: permette al contenuto di attivare lo scroll (override del `min-height: auto` di default dei flex items)
- **`h-[75vh]`**: ridotto da 85vh per mantenere contesto visivo della pagina sottostante (come da preferenza salvata)
- **Rimosso `sticky bottom-0`**: non serve piu' perche' il footer e' gia' posizionato in fondo dal layout flex

