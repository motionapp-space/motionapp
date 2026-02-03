

# Fix: Rimozione PopoverTrigger per Evitare Conflitto

## Problema Root Cause

Il `PopoverTrigger asChild` applica i propri event handler direttamente sul div figlio. Quindi quando clicchi:

1. Il tuo `onClick` → `setIsOpen(true)`
2. Il handler di Radix (iniettato da `PopoverTrigger`) → toggled → `setIsOpen(false)`

`stopPropagation()` non funziona perché entrambi gli handler sono sullo **stesso elemento**, non su elementi annidati.

## Soluzione

Rimuovere `PopoverTrigger` completamente. Usiamo solo:
- `Popover open={isOpen}` (controllato)
- `onOpenChange={setIsOpen}` per gestire la chiusura
- `onPointerDownOutside` per chiudere quando si clicca fuori

---

## Modifiche

### File: `src/components/plan-editor/CategoryMultiSelect.tsx`

**1. Rimuovere PopoverTrigger dall'import (riga 14)**

```tsx
import {
  Popover,
  PopoverContent,
  // PopoverTrigger rimosso
} from "@/components/ui/popover";
```

**2. Rimuovere il wrapper PopoverTrigger (righe 89-90 e 150)**

Prima:
```tsx
<Popover open={isOpen && isInteractive} onOpenChange={setIsOpen}>
  <PopoverTrigger asChild>
    <div ref={containerRef} ...>
      ...
    </div>
  </PopoverTrigger>
  <PopoverContent ...>
```

Dopo:
```tsx
<Popover open={isOpen && isInteractive} onOpenChange={setIsOpen}>
  <div ref={containerRef} onClick={handleContainerClick} ...>
    ...
  </div>
  <PopoverContent ...>
```

**3. Aggiungere PopoverAnchor per posizionamento (opzionale ma raccomandato)**

Per mantenere il posizionamento corretto del dropdown rispetto al container, usiamo `PopoverAnchor`:

```tsx
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";

// Nel JSX:
<Popover open={isOpen && isInteractive} onOpenChange={setIsOpen}>
  <PopoverAnchor asChild>
    <div ref={containerRef} onClick={handleContainerClick} ...>
      ...
    </div>
  </PopoverAnchor>
  <PopoverContent ...>
```

**4. Aggiungere onPointerDownOutside al PopoverContent**

```tsx
<PopoverContent
  className="w-[var(--radix-popover-trigger-width)] p-0"
  align="start"
  sideOffset={4}
  onOpenAutoFocus={(e) => e.preventDefault()}
  onPointerDownOutside={(e) => {
    // Non chiudere se il click e sul container
    if (containerRef.current?.contains(e.target as Node)) {
      e.preventDefault();
    }
  }}
  onInteractOutside={(e) => {
    if (containerRef.current?.contains(e.target as Node)) {
      e.preventDefault();
    }
  }}
>
```

---

## Riepilogo Modifiche

| Linea | Modifica |
|-------|----------|
| 11-15 | Cambia import: rimuovi `PopoverTrigger`, aggiungi `PopoverAnchor` |
| 89 | Rimuovi `<PopoverTrigger asChild>` |
| 90 | Cambia in `<PopoverAnchor asChild>` |
| 150 | Rimuovi `</PopoverTrigger>`, cambia in `</PopoverAnchor>` |
| 157-161 | Aggiungi `onPointerDownOutside` oltre a `onInteractOutside` |

---

## Perche Funziona

1. **Nessun conflitto**: Senza `PopoverTrigger`, nessun handler di toggle viene iniettato
2. **Controllo totale**: Il tuo `onClick` e l'unico che gestisce l'apertura
3. **PopoverAnchor**: Fornisce solo il punto di ancoraggio per il posizionamento, senza logica di click
4. **onPointerDownOutside**: Cattura i click fuori prima che Radix chiuda automaticamente

