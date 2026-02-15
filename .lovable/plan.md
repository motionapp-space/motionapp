

## Refactor Filtri + Lista Pagamenti (Residuo-Based, KPI-Coherent) — Versione Definitiva

### Panoramica

Riscrivere filtri e lista pagamenti per allinearli al modello residuo-based delle KPI. Tabs diventano "Tutti / Da incassare / Pagati". Le righe della lista adottano un layout a 3 blocchi con badge semantici. I click KPI sincronizzano i tabs con chip removibili. Tutte le 6 correzioni della review sono integrate.

---

### File modificati

```text
src/features/payments/types.ts                      -- PaymentStatusFilter aggiornato
src/features/payments/components/PaymentFilters.tsx  -- Nuovi tabs + toggle + chip filtri attivi
src/features/payments/components/PaymentFeed.tsx     -- Filtri residuo-based + sorting + KPI-tab sync
src/features/payments/components/PaymentFeedItem.tsx -- Riscrittura completa layout row 3 blocchi
src/pages/Payments.tsx                              -- KPI click sincronizza tab + reset su cambio tab manuale
```

---

### 1. Types (`types.ts`)

```text
Prima:  "all" | "due" | "paid" | "draft"
Dopo:   "all" | "outstanding" | "paid"
```

---

### 2. PaymentFilters — Riscrittura

**Tabs**: 3 valori

- "Tutti" (all)
- "Da incassare" (outstanding)
- "Pagati" (paid)

**Riga sotto tabs** (flex orizzontale, gap-3):

- Search input (invariato, placeholder "Cerca cliente...")
- DateRangePicker (invariato)
- Toggle "Solo gia' dovuti" — piccolo Switch o Button toggle, visibile SOLO quando tab = "outstanding"

**Nuove props**:

- `onlyDueNow: boolean` + `onOnlyDueNowChange: (v: boolean) => void`

**Chip filtri attivi** (riga sotto i filtri, flex wrap gap-2):

- Chip removibili: rounded-full, bg-foreground/5, text-xs, con X (lucide X icon)
- Appaiono quando:
  - KPI filter attivo (chip "Da incassare" o "Pagati a Feb 2026")
  - Toggle "Solo gia' dovuti" attivo
- Props per gestire i chip: `kpiChipLabel?: string`, `onRemoveKpiChip?: () => void`

---

### 3. PaymentFeed — Logica filtri e sorting

**Costante globale** per stati esclusi:

```text
SKIP_STATUSES = ['canceled', 'refunded', 'void']
```

**Helper residuo** (usato ovunque, con clamp):

```text
residuo = Math.max(0, amount_cents - paid_amount_cents)
```

**Filtri per tab** (tutti escludono SKIP_STATUSES):

```text
tab "all":         status NOT IN SKIP_STATUSES

tab "outstanding": residuo > 0
                   AND status NOT IN SKIP_STATUSES

tab "paid":        residuo <= 0
                   AND paid_amount_cents > 0
                   AND status NOT IN SKIP_STATUSES
```

Fix #1: tab "paid" include anche il guard su SKIP_STATUSES (no ordini rimborsati mostrati come "Pagati").

Fix #3: ordini con amount=0 e paid=0 (gratuiti) rientrano in tab "paid" come "Pagato" con totale 0 EUR (non nascosti). La condizione `paid_amount_cents > 0` li escluderebbe, quindi per gli ordini gratuiti: se `amount_cents === 0 AND residuo === 0` -> trattare come "pagato/chiuso" e includerli nel tab "paid" e "all".

**Toggle "Solo gia' dovuti"** (attivo solo in tab outstanding):

- Mostra solo ordini dove:
  - `kind === 'package_purchase'` (sempre dovuti by design)
  - `kind === 'single_lesson'` AND `event_start_at != null` AND `event_start_at < now()`

**KPI-tab sync** (Fix #5):

Quando `kpiFilter` arriva dal parent:
- `outstanding` -> imposta tab interno su "outstanding", reset onlyDueNow
- `paidInMonth` -> imposta tab interno su "paid", applica filtro paid_at nel mese

Quando utente cambia tab manualmente:
- Reset `kpiFilter` nel parent (callback `onResetKpiFilter`)
- Reset `onlyDueNow` a false

Il tab e' la fonte di verita' visiva. Il kpiFilter e' un "suggerimento" dal parent che viene tradotto in tab + filtri interni.

**Sorting** (Fix #6, con fallback stabile):

```text
Tab "outstanding":
  1. isDueNow = true prima (pacchetti + lezioni passate)
  2. isDueNow = false dopo (lezioni future)
  3. Dentro ogni gruppo: residuo desc
  4. Fallback: created_at desc

Tab "paid":
  1. paid_at desc
  2. Fallback: created_at desc

Tab "all":
  1. created_at desc (invariato)
```

**Container lista**: da `space-y-2` (card separate) a `divide-y divide-border` (border-b divider tra righe).

---

### 4. PaymentFeedItem — Riscrittura completa

Eliminare: icona circolare decorativa, badge status vecchio ("Non Pagato", "In Attesa"), rounded-2xl card border.

**Layout row** — flex items-center, py-3 px-4, hover:bg-muted/30 transition-colors duration-150:

```text
[Sinistra - flex-1 min-w-0]     [Centro - shrink-0]      [Destra - shrink-0 text-right]
Titolo prodotto (truncate)       Badge "Da incassare"     Residuo (bold)
Cliente                          + "Parziale" pill        "Pagato X · Totale Y"
Meta + badge dovuto (solo SL)
```

**Blocco sinistro** (flex-1 min-w-0):

- Titolo: text-sm font-medium text-foreground truncate
  - Single lesson: "Lezione del 5 feb 2026"
  - Pacchetto: "Pacchetto [nome]"
- Sottotitolo: "Mario Rossi" — text-sm text-muted-foreground
- Meta (text-xs text-muted-foreground, mt-1):
  - Single lesson: data/ora sessione + badge inline:
    - "Gia' dovuta" (bg-foreground/5 text-foreground) se event_start_at < now
    - "Non ancora dovuta" (bg-muted text-muted-foreground) se event_start_at >= now o null
    - Se event_start_at null: meta dice "Data lezione non disponibile"
  - Pacchetto: "Venduto il [data creazione]" — nessun badge dovuto (Fix #4: pacchetti sempre dovuti, distinzione solo logica interna)

**Blocco centro** (shrink-0, flex items-center gap-1.5):

- Badge principale:
  - Outstanding (residuo > 0): "Da incassare" — bg-foreground/5 text-foreground (Fix UI #1)
  - Fully paid (residuo <= 0): "Pagato" — bg-emerald-50 text-emerald-700
- Badge secondario (solo se isPartial = paid > 0 AND residuo > 0):
  - "Parziale" — bg-amber-50 text-amber-700, text-xs

**Blocco destro** (shrink-0, text-right):

- Se outstanding:
  - Riga 1: formatEur(residuo) — text-sm font-semibold
  - Riga 2 (solo se isPartial): "Pagato X · Totale Y" — text-xs text-muted-foreground
  - Riga 2 (se non partial): "Totale Y" — text-xs text-muted-foreground
- Se fully paid:
  - Riga 1: formatEur(amount_cents) — text-sm font-semibold
  - Riga 2: "Pagato il [paid_at formattata]" — text-xs text-muted-foreground (se paid_at presente)

**CTA "Pagato"**: Button ghost text-xs con Check icon, visibile solo se residuo > 0 (non piu' basato su status).

---

### 5. Payments.tsx — KPI sync

Aggiungere callback `onResetKpiFilter` passato al Feed:

```text
const handleResetKpiFilter = useCallback(() => setKpiFilter(null), []);
```

Il Feed riceve `onResetKpiFilter` e lo chiama quando l'utente cambia tab manualmente.

---

### 6. Riepilogo edge cases

| Caso | Comportamento |
|------|--------------|
| event_start_at null (single_lesson) | Badge "Non ancora dovuta", meta "Data lezione non disponibile" |
| Ordine gratuito (amount=0, paid=0) | Mostrato come "Pagato" con totale 0,00 EUR |
| paid > amount (overpayment) | Residuo clampato a 0, mostrato come "Pagato" |
| canceled/refunded/void | Esclusi da tutti i tab di default |
| Importi 0 outstanding | Mostra "0,00 EUR", nessun breakdown |

---

### Cose che NON cambiano

- PaymentKPICards.tsx (gia' refactored)
- MonthSelector.tsx
- usePaymentKPIs.ts
- useMarkOrderPaid.ts
- usePayments.ts
- payments.api.ts
- DateRangePicker

