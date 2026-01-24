
# Piano: Rimuovere Linea Grigia e Estendere Tempo "Salvato"

## Problema Identificato
La "linea grigia" che appare quando compare "Salvato" è probabilmente il **focus ring** residuo dell'input o il ring-offset che persiste brevemente. Questo può essere risolto rimuovendo il `ring-offset` quando l'input perde il focus.

## Modifiche

### File 1: `ProductCatalogSettings.tsx`

#### 1.1 — Estendere il timeout da 2000ms a 3500ms (riga 66-68)

Da:
```typescript
savedTimeoutRef.current = window.setTimeout(() => {
  setShowSaved(false);
}, 2000);
```

A:
```typescript
savedTimeoutRef.current = window.setTimeout(() => {
  setShowSaved(false);
}, 3500);
```

---

### File 2: `PriceInput.tsx`

#### 2.1 — Rimuovere il ring-offset dall'input per evitare la linea grigia residua

Il problema è che `ring-offset-2` crea uno spazio tra il bordo e il ring che può apparire come una linea grigia residua. Possiamo sovrascrivere questo comportamento passando una classe che rimuove il ring-offset.

Modifica alla riga 95:

Da:
```tsx
className={cn("pr-8", className)}
```

A:
```tsx
className={cn("pr-8 focus-visible:ring-offset-0", className)}
```

Questo rimuove l'offset del focus ring, eliminando la "linea grigia" che appare tra il bordo dell'input e il ring di focus.

---

## Riepilogo

| File | Modifica |
|------|----------|
| `ProductCatalogSettings.tsx` | Timeout "Salvato" da 2000ms → 3500ms |
| `PriceInput.tsx` | Aggiungere `focus-visible:ring-offset-0` per rimuovere la linea grigia |

---

## Risultato Finale

- Lo stato "Salvato" rimane visibile per 3,5 secondi (1,5s in più)
- Nessuna linea grigia residua quando appare/scompare il feedback
