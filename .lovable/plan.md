
# Fix: Dropdown Categorie che si Chiude Immediatamente

## Problema Identificato

Il dropdown delle categorie si apre e si richiude immediatamente a causa di un **conflitto tra due sistemi di gestione dello stato**:

1. **Gestione manuale**: `handleContainerClick()` chiama `setIsOpen(true)`
2. **Gestione Radix**: `PopoverTrigger` ha il proprio handler di click che fa toggle dello stato

Quando clicchi sul container:
1. `handleContainerClick` → `setIsOpen(true)` → popover si apre
2. Radix `PopoverTrigger` intercetta lo stesso click → toggled back → `setIsOpen(false)`

## Soluzione

Rimuovere il `PopoverTrigger` con `asChild` e gestire manualmente l'apertura del popover, evitando il conflitto. In alternativa, aggiungere `onInteractOutside` e `onPointerDownOutside` per prevenire la chiusura quando si interagisce con elementi interni.

---

## Modifiche da Implementare

### File: `src/components/plan-editor/CategoryMultiSelect.tsx`

**Approccio**: Usare `onInteractOutside` e `onPointerDownOutside` sul `PopoverContent` per controllare quando il popover deve chiudersi, e fermare la propagazione dell'evento nel container.

```tsx
// 1. Modificare handleContainerClick per fermare propagazione
const handleContainerClick = (e: React.MouseEvent) => {
  e.stopPropagation();  // Impedisce al click di risalire
  if (isInteractive) {
    inputRef.current?.focus();
    setIsOpen(true);
  }
};

// 2. Aggiungere handler per PopoverContent
<PopoverContent
  className="w-[var(--radix-popover-trigger-width)] p-0"
  align="start"
  sideOffset={4}
  onOpenAutoFocus={(e) => e.preventDefault()}
  onInteractOutside={(e) => {
    // Chiudi solo se il click e veramente fuori dal container
    if (containerRef.current?.contains(e.target as Node)) {
      e.preventDefault();
    }
  }}
>
```

---

## Dettaglio Implementazione

### Modifica 1: Handler `handleContainerClick`

Aggiungere `e.stopPropagation()` per impedire che l'evento risalga e venga interpretato come un click "outside" da Radix:

```tsx
const handleContainerClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (isInteractive) {
    inputRef.current?.focus();
    setIsOpen(true);
  }
};
```

### Modifica 2: Aggiornare la firma del div onClick

```tsx
<div
  ref={containerRef}
  onClick={handleContainerClick}  // Ora accetta MouseEvent
  ...
>
```

### Modifica 3: Aggiungere `onInteractOutside` al PopoverContent

```tsx
<PopoverContent
  className="w-[var(--radix-popover-trigger-width)] p-0"
  align="start"
  sideOffset={4}
  onOpenAutoFocus={(e) => e.preventDefault()}
  onInteractOutside={(e) => {
    // Non chiudere se il click e dentro il container (trigger)
    if (containerRef.current?.contains(e.target as Node)) {
      e.preventDefault();
    }
  }}
>
```

---

## Riepilogo Modifiche

| Linea | Prima | Dopo |
|-------|-------|------|
| 72 | `const handleContainerClick = () => {` | `const handleContainerClick = (e: React.MouseEvent) => {` |
| 73 | (nessun stopPropagation) | `e.stopPropagation();` |
| 155 | solo `onOpenAutoFocus` | + `onInteractOutside` handler |

---

## Perche Funziona

1. **`e.stopPropagation()`**: Impedisce al click di risalire l'albero DOM e attivare il comportamento di toggle del `PopoverTrigger`

2. **`onInteractOutside`**: Quando Radix rileva un'interazione fuori dal popover, controlliamo se e dentro il container (input area). Se si, preveniamo la chiusura.

Questo permette di:
- Aprire il dropdown cliccando sul container
- Mantenerlo aperto mentre si digita
- Chiuderlo solo con click veramente esterni o premendo Escape
