

## Fix: Barra di progresso invisibile nella card Pacchetto

### Problema
La barra di progresso nella card del pacchetto usa il colore `bg-secondary` come sfondo della traccia. Nel tema light, `--secondary` e definito come `0 0% 100%` (bianco puro), quindi la traccia della barra e completamente invisibile sullo sfondo bianco della card.

### Soluzione
Aggiungere una classe di override nel `PackageCard` per forzare un colore di sfondo visibile sulla traccia della barra, usando il token `bg-muted` (grigio chiaro, `220 12% 96%`) che e gia usato nel design system per sfondi neutri leggermente contrastati.

### Dettaglio tecnico

**File: `src/features/packages/components/PackageCard.tsx`** (riga 185-188)

Da:
```tsx
<Progress 
  value={progressPercent} 
  className="h-2 rounded-full" 
/>
```

A:
```tsx
<Progress 
  value={progressPercent} 
  className="h-2 rounded-full bg-muted" 
/>
```

Questo aggiunge `bg-muted` (grigio chiaro) come sfondo della traccia, sovrascrivendo il `bg-secondary` (bianco) definito nel componente base. La barra diventa cosi visibile con una traccia grigio chiaro e il riempimento `bg-primary` (colore accento).

