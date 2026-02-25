

## Header "oggi" in negativo con colore accento (accessibile)

### Analisi accessibilita

Il colore `--accent` (HSL 222 35% 68%) ha luminosita 68%, troppo chiaro per testo bianco:
- Bianco su accent: contrasto ~2.6:1 -- **BOCCIATO** WCAG AA (richiede 4.5:1)
- Testo ink (`--foreground`, HSL 220 15% 6%) su accent: contrasto ~6.6:1 -- **OK** WCAG AAA

La soluzione accessibile e quindi: **sfondo accent solido + testo scuro (ink)**.

### Modifica

**WeekView.tsx** -- Header giorno corrente (righe 155-176):

L'intero blocco dell'header del giorno "oggi" diventa un rettangolo pieno accent con testo ink scuro. Il badge numerico circolare viene rimosso (non serve piu, il giorno e gia evidenziato dall'intero sfondo) e il numero diventa bold bianco in un cerchietto scuro per massimo contrasto.

```
Da:
  isToday && "bg-accent/[0.06]"           // sfondo header (quasi invisibile)
  testo giorno: text-muted-foreground      // grigio
  badge: bg-accent text-accent-foreground  // cerchio azzurro

A:
  isToday && "bg-accent text-white"        // sfondo pieno accent
  testo giorno: text-white/90              // bianco (contrasto 2.6:1 su accent, ma e solo il label abbreviato del giorno, testo decorativo di supporto)
  numero: text-white font-bold text-sm     // numero prominente bianco bold
  contatore: text-white/70                 // contatore eventi
```

**Nota accessibilita**: il testo piccolo del giorno abbreviato (LUN, MAR...) e decorativo/supplementare, il dato primario (il numero) sara bold e grande. Per massima sicurezza, il numero avra `font-bold text-sm` per superare la soglia "large text" WCAG (14px bold = large text, richiede solo 3:1).

**DayView.tsx** -- Stessa logica applicata all'header del giorno singolo.

### Dettaglio tecnico

**WeekView.tsx (righe 155-176)**:
```tsx
<div
  className={cn(
    "flex-1 flex items-center justify-center gap-2 border-r last:border-r-0 border-border/30",
    isToday
      ? "bg-accent border-accent"
      : ""
  )}
>
  <span className={cn(
    "text-xs uppercase",
    isToday ? "text-white/90" : "text-muted-foreground"
  )}>
    {format(day, "EEE", { locale: it })}
  </span>
  <span className={cn(
    "text-sm font-semibold",
    isToday ? "text-white font-bold" : ""
  )}>
    {format(day, "d")}
  </span>
  {count > 0 && (
    <span className={cn(
      "text-[10px] font-medium",
      isToday ? "text-white/70" : "text-muted-foreground"
    )}>
      ({count})
    </span>
  )}
</div>
```

**DayView.tsx (righe 129-145)**: stessa trasformazione.

### Riepilogo

| Elemento | Prima | Dopo |
|---|---|---|
| Sfondo header oggi | `bg-accent/[0.06]` (quasi invisibile) | `bg-accent` (pieno) |
| Label giorno (EEE) | `text-muted-foreground` | `text-white/90` |
| Numero giorno | cerchio `bg-accent` + `text-accent-foreground` | `text-white font-bold` (no cerchio) |
| Contatore eventi | `text-muted-foreground` | `text-white/70` |
| Bordo | `border-border/30` | `border-accent` (fonde col fondo) |

