
## Fix: Badge "Nessuno" — Allineamento stile grafico

### Problema
Il badge "Nessuno" nel `PackageStatusBadge` usa uno stile neutro piatto (`bg-muted border-border text-muted-foreground`) che non segue la regola grafica degli altri badge:

| Badge | Sfondo | Bordo | Testo | Coerente? |
|-------|--------|-------|-------|-----------|
| Attivo | `bg-success/10` | `border-success/50` | `text-foreground` | Si |
| Da pianificare | `bg-warning/10` | `border-warning/50` | `text-foreground` | Si |
| **Nessuno** | `bg-muted` | `border-border` | `text-muted-foreground` | **No** |

La regola e: sfondo colorato leggero (10% opacita), bordo dello stesso colore ma piu intenso (50% opacita), testo nero (`text-foreground`).

### Soluzione
Applicare la stessa regola usando il token `muted-foreground` come colore semantico per "neutro/assente". Il risultato sara un badge con sfondo grigio leggero e bordo grigio piu marcato, coerente con gli altri.

### Dettaglio tecnico

**File: `src/features/clients/components/badges/PackageStatusBadge.tsx`** (riga 36)

Da:
```tsx
className: "border-border bg-muted text-muted-foreground"
```

A:
```tsx
className: "border-muted-foreground/50 bg-muted-foreground/10 text-foreground dark:text-muted-foreground"
```

**File: `src/features/clients/components/badges/ActivePlanBadge.tsx`** (riga 32-33)

Stesso fix per il badge "Nessuno" in ActivePlanBadge:

Da:
```tsx
"border-border bg-muted text-muted-foreground"
```

A:
```tsx
"border-muted-foreground/50 bg-muted-foreground/10 text-foreground dark:text-muted-foreground"
```

### Risultato visivo atteso
Tutti e tre i badge seguiranno lo stesso pattern: sfondo leggero + bordo piu scuro della stessa famiglia cromatica + testo nero. "Nessuno" avra una tinta grigia neutra ma con la stessa struttura visiva di "Attivo" (verde) e "Da pianificare" (arancione).
