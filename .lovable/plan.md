

# Piano: Bottom Bar Affordance Mobile-First

## Obiettivo

Migliorare l'affordance (chiarezza interattiva) della bottom bar nella live session per dispositivi touch, senza cambiare layout, gerarchia o logica.

---

## Stato attuale

| Elemento | Problema |
|----------|----------|
| "Precedente" / "Successivo" | Solo `hover:text-foreground`, nessuna icona chevron, feedback touch assente |
| "Termina allenamento" | Solo `hover:text-destructive`, nessuna icona, contrasto basso |

---

## Modifiche

### 1. Import icone

**File:** `src/pages/client/ClientLiveSession.tsx` (linea 14)

Aggiungere `StopCircle` all'import esistente:

```tsx
import { ArrowLeft, Check, Undo2, Dumbbell, ChevronLeft, ChevronRight, StopCircle } from 'lucide-react';
```

---

### 2. Navigation buttons (linee 891-913)

**Prima:**
```tsx
<button
  type="button"
  onClick={() => store.prevGroup()}
  disabled={!canGoPrev}
  className={cn(
    "text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2",
    !canGoPrev && "opacity-40 pointer-events-none"
  )}
>
  ‹ Precedente
</button>
```

**Dopo:**
```tsx
<button
  type="button"
  onClick={() => store.prevGroup()}
  disabled={!canGoPrev}
  className={cn(
    "min-h-[44px] px-3 py-2 rounded-lg",
    "inline-flex items-center gap-1",
    "text-sm text-muted-foreground",
    "cursor-pointer select-none",
    "active:bg-muted/40",
    "focus-visible:bg-muted/40 focus-visible:outline-none",
    "transition-colors",
    !canGoPrev && "opacity-40 pointer-events-none"
  )}
>
  <ChevronLeft className="h-4 w-4" />
  <span>Precedente</span>
</button>
```

Stessa struttura per "Successivo" con `ChevronRight` dopo il testo:

```tsx
<button
  type="button"
  onClick={() => store.nextGroup()}
  disabled={!canGoNext}
  className={cn(
    "min-h-[44px] px-3 py-2 rounded-lg",
    "inline-flex items-center gap-1",
    "text-sm text-muted-foreground",
    "cursor-pointer select-none",
    "active:bg-muted/40",
    "focus-visible:bg-muted/40 focus-visible:outline-none",
    "transition-colors",
    !canGoNext && "opacity-40 pointer-events-none"
  )}
>
  <span>Successivo</span>
  <ChevronRight className="h-4 w-4" />
</button>
```

---

### 3. "Termina allenamento" button (linee 917-928)

**Prima:**
```tsx
<button
  type="button"
  onClick={() => setShowFinishDialog(true)}
  className={cn(
    "w-full min-h-[44px] flex items-center justify-center text-sm transition-colors",
    isLastGroupComplete
      ? "text-destructive/70 hover:text-destructive"
      : "text-destructive/50 hover:text-destructive"
  )}
>
  Termina allenamento
</button>
```

**Dopo:**
```tsx
<button
  type="button"
  onClick={() => setShowFinishDialog(true)}
  className={cn(
    "w-full min-h-[44px] px-3 py-2 rounded-lg",
    "inline-flex items-center justify-center gap-2",
    "text-sm",
    "cursor-pointer select-none",
    "active:bg-destructive/10 active:underline",
    "focus-visible:bg-destructive/10 focus-visible:underline focus-visible:outline-none",
    "transition-colors",
    isLastGroupComplete
      ? "text-destructive/60"
      : "text-destructive/50"
  )}
>
  <StopCircle className="h-4 w-4" />
  <span>Termina allenamento</span>
</button>
```

---

## Riepilogo modifiche

| Elemento | Modifica |
|----------|----------|
| **Precedente** | + icona `ChevronLeft`, + 44px tap target, + `active:bg-muted/40`, + `focus-visible` |
| **Successivo** | + icona `ChevronRight`, + 44px tap target, + `active:bg-muted/40`, + `focus-visible` |
| **Termina allenamento** | + icona `StopCircle`, + contrasto (`/60` invece di `/50`), + `active:underline`, + `focus-visible` |

---

## Specifiche pixel-perfect

| Proprietà | Nav buttons | Termina |
|-----------|-------------|---------|
| Min height | 44px | 44px |
| Padding | px-3 py-2 | px-3 py-2 |
| Border radius | rounded-lg (8px) | rounded-lg (8px) |
| Icon size | 16px (h-4 w-4) | 16px (h-4 w-4) |
| Gap icon-text | gap-1 (4px) | gap-2 (8px) |
| Active state | bg-muted/40 | bg-destructive/10 + underline |
| Focus visible | bg-muted/40 | bg-destructive/10 + underline |

---

## File da modificare

- `src/pages/client/ClientLiveSession.tsx` (linee 14, 891-928)

