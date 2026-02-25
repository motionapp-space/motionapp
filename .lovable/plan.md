

## Card "Incassato nel mese" con sfondo accent e MonthSelector integrato

### Cosa cambia

**1. Sfondo accent pieno sulla card**
La card "Incassato nel mese" passa da sfondo bianco/card a sfondo `bg-accent` con testi chiari, creando un punto focale vivace nella pagina.

**2. MonthSelector spostato dentro la card**
Il selettore mese viene rimosso dalla posizione isolata in alto a destra e integrato nell'header della card, in alto a destra dentro la card stessa. Questo chiarisce immediatamente che il filtro temporale si applica solo a quel dato.

### Accessibilita

| Elemento | Stile | Contrasto su accent |
|---|---|---|
| Importo (3xl bold) | `text-white font-bold` | ~2.6:1 -- OK (large text, soglia 3:1) |
| Label "Incassato nel mese" | `text-white/90` | OK (testo di supporto) |
| Sottotitolo | `text-white/70` | Decorativo/supplementare |
| MonthSelector button | `text-white/80 hover:text-white` | Interattivo con hover |

### Dettaglio tecnico

**`PaymentKPICards.tsx`** -- Card 2 diventa:

```tsx
{/* Card 2 — Incassato nel mese (sfondo accent, con MonthSelector) */}
<div className="col-span-1 rounded-2xl bg-accent p-6 select-none">
  <div className="flex items-start justify-between">
    <p className="text-sm text-white/80">Incassato nel mese</p>
    {monthSelector}
  </div>
  <p className="text-3xl font-bold text-white mt-1">
    {formatEur(incassatoMese)}
  </p>
  <p className="text-xs text-white/60 mt-2">
    Incassi registrati nel mese (parziali inclusi)
  </p>
</div>
```

Il componente riceve il `monthSelector` come prop `React.ReactNode` per mantenere lo stato nel parent.

**`MonthSelector.tsx`** -- Variante chiara:

Il MonthSelector riceve una prop opzionale `variant?: "default" | "light"`. Quando `light`:
- Il trigger button usa `text-white/80 hover:text-white hover:bg-white/10` invece dello stile ghost standard
- Il chevron diventa bianco

```tsx
<Button
  variant="ghost"
  size="sm"
  className={cn(
    "rounded-full text-sm gap-1",
    variant === "light"
      ? "text-white/80 hover:text-white hover:bg-white/10"
      : ""
  )}
>
```

**`Payments.tsx`** -- Rimozione MonthSelector dall'header:

- Rimuovere il `<div className="flex justify-end">` con il MonthSelector
- Passare il MonthSelector come prop `monthSelector` a `PaymentKPICards`

```tsx
<PaymentKPICards
  kpis={kpis}
  monthLabel={monthLabel}
  onFilterOutstanding={handleFilterOutstanding}
  isOutstandingActive={kpiFilter?.type === "outstanding"}
  monthSelector={
    <MonthSelector
      value={selectedMonth}
      onChange={setSelectedMonth}
      variant="light"
    />
  }
/>
```

### Riepilogo modifiche

| File | Modifica |
|---|---|
| `PaymentKPICards.tsx` | Card 2: sfondo `bg-accent`, testi bianchi, rimozione bordo, aggiunta slot `monthSelector` |
| `MonthSelector.tsx` | Aggiunta prop `variant: "light"` per trigger bianco su sfondo accent |
| `Payments.tsx` | Rimozione MonthSelector dall'header, passaggio come prop a PaymentKPICards |

