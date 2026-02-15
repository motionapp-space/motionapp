

## Micro-hardening UI/State — Versione Matura Finale

### 4 interventi chirurgici

---

### 1. Toggle KPI "Da incassare" — Reset completo stato feed

In `Payments.tsx`:
- Il `handleFilterOutstanding` deve comunicare al feed anche il tab desiderato
- Quando si **disattiva** (click su card gia' attiva): `setKpiFilter(null)` — il feed deve tornare a tab "all" e `onlyDueNow=false`
- Quando si **attiva**: `setKpiFilter({ type: "outstanding" })` — il feed switcha a tab "outstanding"

Implementazione: il feed gia' reagisce a `kpiFilter` via `useEffect`. Basta estendere l'effetto:
- Aggiungere un ramo `if (kpiFilter === null)`: `setStatus("all")` + `setOnlyDueNow(false)`

Attenzione: oggi il `useEffect` ha `if (!kpiFilter) return` come prima riga, che skippa il reset. Cambiare in: gestire esplicitamente il caso `null`.

Ma c'e' un problema: al mount iniziale `kpiFilter` e' `null` e non vogliamo forzare "all" (il default e' "outstanding"). Soluzione: usare un `useRef` per tracciare se il kpiFilter e' mai stato attivo, oppure piu' semplicemente tracciare il valore precedente. Approccio piu' pulito: reagire solo quando `kpiFilter` cambia **da un valore non-null a null** usando un ref `prevKpiFilter`.

In `PaymentFeed.tsx`:
```
const prevKpiFilter = useRef(kpiFilter);
useEffect(() => {
  if (kpiFilter?.type === "outstanding") {
    setStatus("outstanding");
    setOnlyDueNow(false);
  } else if (prevKpiFilter.current && !kpiFilter) {
    // Was active, now reset
    setStatus("all");
    setOnlyDueNow(false);
  }
  prevKpiFilter.current = kpiFilter;
}, [kpiFilter]);
```

---

### 2. Micro-label KPI — Evitare layout shift

In `PaymentKPICards.tsx`:
- La label in alto a destra della card "Da incassare" deve occupare sempre la stessa area
- Usare una pill con `min-w-[5rem] text-center` (o equivalente) per entrambi gli stati
- Default: "Filtra" — `text-xs text-muted-foreground`
- Attivo: "Filtro attivo" — `text-xs text-foreground font-medium`
- Stessa dimensione contenitore, cambia solo testo e colore

Nuova prop: `isOutstandingActive: boolean`

Layout card 1 header: flex row con "Da incassare" a sinistra e pill a destra.

---

### 3. Card "Incassato" — Comunicare non-interattivita'

In `PaymentKPICards.tsx`:
- Rimuovere: `onClick={onFilterPaidInMonth}`, `cursor-pointer`, `transition-colors duration-150`, `hover:border-foreground/20`
- Aggiungere: `select-none`, `border-border/70` (bordo piu' soft del default)
- Label: "Incassato nel mese" (statica)
- Sotto importo: "Incassi registrati nel mese (parziali inclusi)" in `text-xs text-muted-foreground mt-2`
- Rimuovere prop `onFilterPaidInMonth` dall'interfaccia

---

### 4. Rimuovere `paidInMonth` + chip KPI + cleanup props

In `Payments.tsx`:
- Tipo `KpiFilter = { type: "outstanding" } | null`
- Rimuovere `handleFilterPaidInMonth`
- Rimuovere prop `onFilterPaidInMonth` da `PaymentKPICards`
- Passare `isOutstandingActive={kpiFilter?.type === "outstanding"}`
- Rimuovere `subtitle` da `TabHeader`

In `PaymentFeed.tsx`:
- Rimuovere ramo `paidInMonth` da useEffect (gia' rimpiazzato dal ref logic sopra)
- Rimuovere blocco filtro `paidInMonth` dal useMemo
- Rimuovere `kpiChipLabel` e `onRemoveKpiChip` dal passaggio a `PaymentFilters`
- Rimuovere import `format`/`it` (non piu' necessari per chip label)
- Rimuovere prop `selectedMonth` dall'interfaccia (non piu' usata)

In `PaymentFilters.tsx`:
- Rimuovere props `kpiChipLabel` e `onRemoveKpiChip` dall'interfaccia
- Rimuovere la logica chip KPI dal rendering
- I chip restano solo per "Solo gia' dovuti"

---

### Sezione tecnica — File modificati

```text
src/pages/Payments.tsx
  - KpiFilter = { type: "outstanding" } | null
  - Rimuovere handleFilterPaidInMonth, subtitle
  - Passare isOutstandingActive a PaymentKPICards
  - Rimuovere selectedMonth da PaymentFeed props

src/features/payments/components/PaymentKPICards.tsx
  - Rimuovere prop onFilterPaidInMonth
  - Aggiungere prop isOutstandingActive: boolean
  - Card 1: flex header con pill "Filtra"/"Filtro attivo" (min-w fissa)
  - Card 1: hover:bg-muted/20, stato attivo border-foreground/40
  - Card 1: barra h-2.5 -> h-1.5, rimuovere paragrafo lungo
  - Card 2: no onClick, no hover, select-none, border-border/70
  - Card 2: label statica + nota editoriale

src/features/payments/components/PaymentFeed.tsx
  - useRef per prevKpiFilter: reset a "all" solo quando kpiFilter va da attivo a null
  - Rimuovere tutta la logica paidInMonth
  - Non passare kpiChipLabel/onRemoveKpiChip a PaymentFilters
  - Rimuovere prop selectedMonth

src/features/payments/components/PaymentFilters.tsx
  - Rimuovere props kpiChipLabel e onRemoveKpiChip
  - Chip solo per "Solo gia' dovuti"
```

Nessun file nuovo. Nessuna modifica backend.

