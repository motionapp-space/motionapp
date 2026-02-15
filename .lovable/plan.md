

## Refactor KPI Pagamenti — Versione Definitiva (Residuo-Based, Partial-Pay Ready)

### Panoramica

Riscrittura completa della sezione KPI: da 3 card animate a 2 card editoriali. Introduce `paid_amount_cents` nel DB per supportare pagamenti parziali futuri. Tutta la logica KPI diventa residuo-based (mai status-based). Aggiunge selettore mese per "Incassato".

---

### Passo 1 — Migrazione DB

Aggiungere colonna `paid_amount_cents` alla tabella `orders` e backfillare gli ordini gia' pagati:

```sql
ALTER TABLE orders
  ADD COLUMN paid_amount_cents integer NOT NULL DEFAULT 0;

UPDATE orders
SET paid_amount_cents = amount_cents
WHERE status = 'paid';
```

---

### Passo 2 — Aggiornare RPC `mark_order_as_paid`

Aggiungere `paid_amount_cents = amount_cents` nell'UPDATE della funzione esistente:

```sql
UPDATE orders
SET
  status = 'paid',
  paid_at = NOW(),
  paid_amount_cents = amount_cents,
  external_payment_id = COALESCE(p_external_payment_id, external_payment_id)
WHERE id = p_order_id
  AND status IN ('draft', 'due')
RETURNING * INTO v_order;
```

---

### Passo 3 — Types + API

**`types.ts`**: Aggiungere `paid_amount_cents: number` a `PaymentOrder`.

**`payments.api.ts`**: Aggiungere `paid_amount_cents` alla select e al mapping.

---

### Passo 4 — Hook `usePaymentKPIs.ts` (riscrittura completa)

Nuovo contratto:

```text
Input:  orders[], selectedMonth: Date
Output: { daIncassareTotale, parteCerta, parteNonCerta, incassatoMese } (tutti in cents)
```

Logica:

```text
for each order:
  // Hard guard: skip canceled/refunded
  if status in ['canceled', 'refunded', 'void'] -> skip

  residuo = amount_cents - paid_amount_cents
  if residuo <= 0 -> skip (fully paid or overpaid)

  if kind === 'package_purchase':
    parteCerta += residuo

  if kind === 'single_lesson':
    if event_start_at != null AND event_start_at < now():
      parteCerta += residuo
    else:
      parteNonCerta += residuo  // null event_start_at = anomalia, trattata come non certa

daIncassareTotale = parteCerta + parteNonCerta

// Incassato mese: basato su paid_at + paid_amount_cents
for each order:
  if paid_at is in selectedMonth AND paid_amount_cents > 0:
    incassatoMese += paid_amount_cents
```

Vincolo dichiarato: modello "single payment event per order" finche' non esiste tabella payments/ledger.

---

### Passo 5 — Componente `PaymentKPICards.tsx` (riscrittura completa)

Eliminare: framer-motion, icone decorative, 3 card.

**Layout**: Grid 3 colonne desktop (gap-6). "Da incassare" = col-span-2. "Incassato" = col-span-1. Stack su mobile.

**Card 1 — "Da incassare"**:
- Card bianca, border `border`, rounded-2xl, p-6, no shadow
- Label: "Da incassare" text-sm text-muted-foreground
- Importo: text-3xl font-semibold text-foreground
- Breakdown (mt-3, space-y-2), righe visibili solo se valore > 0:
  - Dot verde + "X,XX EUR gia' dovuti" text-sm text-emerald-600
  - Dot grigio + "X,XX EUR non ancora dovuti" text-sm text-muted-foreground
- Barra stacked (h-2.5 rounded-full mt-3, solo se totale > 0):
  - Segmento emerald-500 (parteCerta/totale), segmento muted (resto)
- Riga helper: "Gia' dovuti = pacchetti venduti o lezioni svolte. Non ancora dovuti = lezioni future." text-xs text-muted-foreground mt-2
- Hover: border-foreground/20, cursor-pointer, transition-colors duration-150
- Click: callback `onFilterOutstanding()` che filtra feed su residuo > 0

**Card 2 — "Incassato a [Mese Anno]"**:
- Stesso stile card, 1 colonna
- Label dinamica: "Incassato a Feb 2026" text-sm text-muted-foreground
- Importo: text-3xl font-semibold text-emerald-700
- Subtext: "Basato sulla data di pagamento" text-xs text-muted-foreground mt-2
- Click: callback `onFilterPaidInMonth()`

**Edge cases**:
- Totale 0: mostrare "0,00 EUR", nascondere breakdown, barra, e riga helper
- Solo parte certa: solo riga "gia' dovuti", barra 100% verde
- Solo parte non certa: solo riga "non ancora dovuti", barra 100% grigia

---

### Passo 6 — Selettore mese

Ghost button rounded-full text-sm posizionato top-right nella riga sopra le KPI (allineato con TabHeader). Label: "Feb 2026" + ChevronDown. Dropdown (Popover + Command o semplice lista) con mese corrente + ultimi 6 mesi.

Impatto: cambia SOLO "Incassato nel mese", NON "Da incassare".

---

### Passo 7 — Pagina `Payments.tsx`

- State `selectedMonth` (default: mese corrente)
- Passare `selectedMonth` a `usePaymentKPIs`
- Rendere selettore mese
- Skeleton loading: grid 3 col, skeleton col-span-2 + skeleton col-span-1
- Callbacks click KPI che impostano filtri nel feed con logica residuo-based (non status-based)
- Il feed riceve un nuovo prop per il filtro "outstanding" (residuo > 0) e "paid in month"

---

### Passo 8 — PaymentFeed adattamento

Il PaymentFeed deve supportare un filtro aggiuntivo residuo-based proveniente dal click KPI. Il filtro status tabs resta, ma si aggiunge la possibilita' di filtrare per `amount_cents - paid_amount_cents > 0` (outstanding) o per `paid_at nel mese selezionato` (paid in month), attivabili dai click sulle KPI cards.

---

### Riepilogo file

```text
MIGRAZIONE DB:
  - ADD COLUMN paid_amount_cents + backfill
  - UPDATE mark_order_as_paid RPC

CODICE MODIFICATO:
  src/features/payments/types.ts                     -- +paid_amount_cents
  src/features/payments/api/payments.api.ts          -- +paid_amount_cents nella select
  src/features/payments/hooks/usePaymentKPIs.ts      -- Riscrittura completa
  src/features/payments/components/PaymentKPICards.tsx -- Riscrittura completa (2 card editoriali)
  src/pages/Payments.tsx                             -- selectedMonth + selettore + callbacks + skeleton
  src/features/payments/components/PaymentFeed.tsx   -- Supporto filtro residuo-based da KPI click

INVARIATI:
  src/features/payments/components/PaymentFeedItem.tsx
  src/features/payments/components/PaymentFilters.tsx
  src/features/payments/hooks/useMarkOrderPaid.ts
  src/features/payments/hooks/usePayments.ts
```

