

## Refactor filtro Periodo — DateRangePicker chiaro, azzerabile, hardened

### Panoramica

Riscrittura completa del `DateRangePicker` con trigger "Dal/Al", stato draft interno, footer Applica/Azzera, e reset sicuro da 3 punti. Aggiunta chip periodo in `PaymentFilters`.

---

### 1. Riscrittura `src/components/ui/date-range-picker.tsx`

**Stato interno:**
- `open`: controlled popover state
- `draft: DateRange | undefined`: stato locale, inizializzato da `value`
- Quando il popover si apre (`onOpenChange(true)`): sync `draft = value`
- Quando `open === false` e `value` cambia esternamente (es. chip reset): sync `draft = value` via `useEffect`

**Trigger (bottone unico, due segmenti):**
- Container: `h-9 rounded-full border border-border bg-background px-3 text-sm flex items-center gap-2`
- Segmento start: "Dal 12 feb 2026" o "Dal —" (vuoto in `text-muted-foreground`, pieno in `text-foreground`)
- Divider: `h-4 w-px bg-border`
- Segmento end: "Al 20 feb 2026" o "Al —"
- Reset X a destra (solo se `value?.from || value?.to`):
  - `onMouseDown`: `preventDefault()` + `stopPropagation()` (impedisce apertura popover)
  - `onClick`: `preventDefault()` + `stopPropagation()` + `onChange(undefined)`
  - `aria-label="Azzera periodo"`
  - Classi: `ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground`

**Popover contenuto:**
- Hint in alto: "Seleziona una data di inizio e una di fine" (`text-xs text-muted-foreground`)
- Helper condizionale: se `draft?.from && !draft?.to` mostra "Seleziona anche la data di fine"
- Calendario: `mode="range"`, `selected={draft}`, `onSelect={setDraft}`
- Footer sticky:
  - Sinistra: "Azzera" (ghost), disabilitato se `!draft?.from && !draft?.to`. Click: reset draft, chiude, chiama `onChange(undefined)` solo se `value` non era gia' `undefined`
  - Destra: "Applica" (default), disabilitato se `!draft?.to`. Click: `onChange(draft)`, chiude

---

### 2. Update `src/features/payments/components/PaymentFilters.tsx`

**Chip periodo** (aggiunto all'array `chips` esistente):
- Condizione: `dateRange?.from && dateRange?.to`
- Formato label intelligente:
  - Stesso mese e anno: `Periodo: 12–20 feb 2026`
  - Mesi diversi, stesso anno: `Periodo: 28 gen – 5 feb 2026`
  - Anni diversi: `Periodo: 28 dic 2025 – 5 gen 2026`
- Click X: `onDateRangeChange(undefined)`

---

### Sezione tecnica — File modificati

```text
src/components/ui/date-range-picker.tsx
  - Riscrittura completa
  - Controlled popover (open state)
  - Draft state + sync su open e su value change esterno
  - Trigger con segmenti "Dal/Al" + X reset (onMouseDown hardened)
  - Popover: hint, helper condizionale, footer Azzera/Applica
  - Rimuovere prop placeholder (non piu' usato)

src/features/payments/components/PaymentFilters.tsx
  - Aggiungere chip "Periodo: ..." nel blocco chips
  - Format condizionale con date-fns (format, isSameMonth, isSameYear)
  - Nessuna modifica ai props dell'interfaccia
```

Nessun file nuovo. Nessuna modifica backend.
