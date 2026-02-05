
# Piano: Fix Centratura e Scroll Modale PackageDialog

## Problema

La modale di creazione pacchetti:
1. **Non scorre** quando il contenuto supera l'altezza della viewport
2. **Appare tagliata** in basso (il footer con i pulsanti non è visibile)

Causa: `DialogContent` usa posizionamento fisso centrato (`top-[50%] translate-y-[-50%]`) senza vincoli di altezza massima né overflow scroll.

---

## Soluzione

Modificare il componente `DialogContent` in `src/components/ui/dialog.tsx` per supportare nativamente contenuti lunghi.

### `src/components/ui/dialog.tsx`

**Linea 39** — Aggiungere vincoli di altezza e scroll:

```typescript
// Da:
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ..."

// A:
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg max-h-[85vh] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 overflow-y-auto ..."
```

Aggiunte:
- `max-h-[85vh]` — La modale non può superare l'85% dell'altezza viewport
- `overflow-y-auto` — Abilita scroll verticale quando il contenuto eccede

---

## Alternativa (se preferisci non toccare il componente base)

Applicare le classi solo alla modale `PackageDialog.tsx`:

```typescript
// Linea 163
<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
```

**Consiglio**: La soluzione sul componente base è migliore perché risolve il problema per tutte le modali dell'app.

---

## Riepilogo

| File | Modifica |
|------|----------|
| `dialog.tsx` | Aggiungere `max-h-[85vh] overflow-y-auto` a DialogContent |

Questo garantisce che tutte le Dialog siano sempre scrollabili e non escano dalla viewport.
