

## Ravvivare la griglia del calendario con il colore di accento

### Problema
La griglia del calendario e quasi interamente grigia: linee orarie grigie, bordi grigi, sfondo del giorno corrente appena percettibile (`bg-primary/[0.02]`), overlay disponibilita con `bg-primary/5`. Il risultato e piatto e poco vivace.

### Interventi proposti

Usiamo il token `--accent` (Ice Neutral, `222 35% 68%`) gia definito nel design system per dare un tocco di colore senza stravolgere l'estetica minimale.

#### 1. Colonna del giorno corrente — sfondo piu visibile
**File: `WeekView.tsx` e `DayView.tsx`**

Cambiare lo sfondo del giorno corrente da `bg-primary/[0.02]` (quasi invisibile) a `bg-accent/[0.04]` — un velo azzurro leggero ma percettibile.

Stesso trattamento per l'header del giorno corrente: da `bg-primary/5` a `bg-accent/[0.06]`.

#### 2. Linea dell'ora corrente — colore accento
**File: `WeekView.tsx` e `DayView.tsx`**

La linea e il pallino "now" passano da `bg-primary` (nero) a `bg-accent` (azzurro). Molto piu vivace e immediato.

#### 3. Badge giorno corrente nell'header — accento
**File: `WeekView.tsx` e `DayView.tsx`**

Il cerchietto con il numero del giorno corrente passa da `bg-primary text-primary-foreground` a `bg-accent text-accent-foreground` — un cerchio azzurro invece che nero.

#### 4. Overlay disponibilita — bordo e sfondo accento
**File: `AvailabilityOverlay.tsx`**

Cambiare `border-primary/30` e `bg-primary/5` a `border-accent/30` e `bg-accent/[0.06]`. Le fasce di disponibilita diventano azzurrine anziche grigio-nerastre.

#### 5. Linee orarie — leggermente piu morbide
**File: `WeekView.tsx` e `DayView.tsx`**

Le linee orarie restano `border-border/80` ma aggiungiamo un trattino piu sottile ogni mezza ora? No, manteniamo semplicita: cambiamo solo `border-border/80` a `border-border/50` per rendere la griglia meno pesante e far risaltare di piu gli eventi colorati.

### Riepilogo file da modificare

| File | Modifica |
|---|---|
| `src/features/events/components/WeekView.tsx` | Sfondo today, header today badge, linea now, linee orarie |
| `src/features/events/components/DayView.tsx` | Stesse modifiche della WeekView |
| `src/features/bookings/components/AvailabilityOverlay.tsx` | Bordo e sfondo da primary a accent |

### Dettaglio tecnico

**WeekView.tsx / DayView.tsx — Sfondo colonna today:**
```
- isDayToday && "bg-primary/[0.02]"
+ isDayToday && "bg-accent/[0.04]"
```

**WeekView.tsx / DayView.tsx — Header today:**
```
- isToday && "bg-primary/5"
+ isToday && "bg-accent/[0.06]"
```

**WeekView.tsx / DayView.tsx — Badge numero giorno:**
```
- isToday && "bg-primary text-primary-foreground rounded-full ..."
+ isToday && "bg-accent text-accent-foreground rounded-full ..."
```

**WeekView.tsx / DayView.tsx — Linea now:**
```
- <div className="w-2.5 h-2.5 rounded-full bg-primary -ml-1" />
- <div className="flex-1 h-[2px] bg-primary" />
+ <div className="w-2.5 h-2.5 rounded-full bg-accent -ml-1" />
+ <div className="flex-1 h-[2px] bg-accent" />
```

**WeekView.tsx / DayView.tsx — Linee orarie:**
```
- border-t border-border/80
+ border-t border-border/50
```

**AvailabilityOverlay.tsx:**
```
- border-l-2 border-primary/30 bg-primary/5
+ border-l-2 border-accent/30 bg-accent/[0.06]
```

