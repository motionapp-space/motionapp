## Sezione Pagamenti - "Money Inbox" per il Coach

### Panoramica

Nuova pagina `/payments` che funge da centro di comando finanziario. Il coach vede tutti i pagamenti pendenti (ordini e pacchetti) in un feed unificato, con KPI riassuntive e filtri strategici. Si basa interamente sulla tabella `orders` unificata nelle fasi precedenti.

---

### Struttura file

```text
src/pages/Payments.tsx                          -- Pagina principale (routing + topbar)
src/features/payments/
  api/payments.api.ts                           -- Query Supabase per orders + join client
  hooks/usePayments.ts                          -- React Query hook
  hooks/usePaymentKPIs.ts                       -- KPI calculations (da incassare, incassato mese, in attesa)
  hooks/useMarkOrderPaid.ts                     -- Mutation wrapper per RPC mark_order_as_paid
  components/PaymentKPICards.tsx                 -- 3 Card animate con framer-motion
  components/PaymentFeed.tsx                     -- Lista unificata con filtri e ricerca
  components/PaymentFeedItem.tsx                 -- Singola riga (lezione singola o pacchetto)
  components/PaymentFilters.tsx                  -- Tabs + ricerca + date range
  types.ts                                      -- Tipi TypeScript
src/components/ui/date-range-picker.tsx          -- Componente date range picker (nuovo)
```

---

### 1. Routing e Navigazione

**App.tsx**: Aggiungere rotta `/payments` dentro il blocco `CoachLayout`, prima di `Settings`.

**AppSidebar.tsx** e **MobileNav.tsx**: Inserire voce "Pagamenti" con icona `Wallet` da Lucide, posizionata tra "Libreria" e "Impostazioni" nell'array `NAV_ITEMS`. La logica `active` usa `pathname.startsWith("/payments")`.

---

### 2. Pagina `Payments.tsx`

Segue il pattern standard delle altre pagine coach:

- `useTopbar({ title: "Pagamenti" })`
- Layout: `mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 py-6`
- Struttura: KPI cards in alto, sotto il feed filtrato

---

### 3. Data Layer (`payments.api.ts`)

Query principale sugli ordini con join per ottenere i dati cliente:

```text
SELECT orders.*, 
  coach_clients.client_id,
  clients.first_name, clients.last_name,
  events.start_at as event_start_at, events.title as event_title,
  package.name as package_name
FROM orders
JOIN coach_clients ON orders.coach_client_id = coach_clients.id
JOIN clients ON coach_clients.client_id = clients.id
LEFT JOIN events ON orders.event_id = events.id
LEFT JOIN package ON orders.package_id = package.package_id
WHERE coach_clients.coach_id = auth.uid()
ORDER BY created_at DESC
```

Il filtro RLS su `orders` gia' limita ai coach_clients del coach autenticato.

---

### 4. KPI Cards (`PaymentKPICards.tsx`)

Tre card con animazione `framer-motion` (stagger entry):


| KPI            | Calcolo                                                                        | Colore                     |
| -------------- | ------------------------------------------------------------------------------ | -------------------------- |
| Da Incassare   | `SUM(amount_cents)` dove `status = 'due'`                                      | `text-destructive` (rosso) |
| Incassato Mese | `SUM(amount_cents)` dove `status = 'paid'` e `mese 'Febbraio', 'Marzo', ecc..` | `text-emerald-600` (verde) |
| In Attesa      | `COUNT(*)` dove `status = 'draft'`                                             | `text-amber-500` (giallo)  |


Le KPI vengono calcolate client-side dai dati gia' fetchati, senza query aggiuntive. Ogni card ha un'icona in background con opacita' ridotta e sfumatura.

---

### 5. Feed Unificato (`PaymentFeed.tsx` + `PaymentFeedItem.tsx`)

Ogni item mostra:

- **Lezione singola** (`kind = 'single_lesson'`): Icona `Calendar`, label "Lezione del [data evento] - [Nome Cliente]"
- **Pacchetto** (`kind = 'package_purchase'`): Icona `Package`, label "Pacchetto [nome] - [Nome Cliente]"
- Importo formattato in EUR
- Badge di stato: "Non Pagato" (destructive), "In Attesa" (outline/amber), "Pagato" (default/green)
- Azione rapida: bottone "Segna come pagato" che chiama `mark_order_as_paid` RPC

Card design: `rounded-2xl`, hover con `hover:shadow-sm hover:border-primary/20`, transizione delicata.

---

### 6. Filtri (`PaymentFilters.tsx`)

- **Segmented Control**: Tabs shadcn con valori "Tutti", "Da Pagare" (default, `status IN ('due')`), "Pagati" (`status = 'paid'`), "In Attesa" (`status = 'draft'`)
- **Ricerca cliente**: Input con icona `Search`, filtro client-side su `first_name + last_name`
- **Date Range**: Nuovo componente `date-range-picker.tsx` basato su `react-day-picker` (gia' installato) + Popover shadcn. Filtra per `orders.created_at` nel range selezionato.

---

### 7. Componente Date Range Picker

Nuovo componente UI riutilizzabile `src/components/ui/date-range-picker.tsx`:

- Basato su `react-day-picker` (gia' disponibile) con mode="range"
- Trigger: bottone con icona Calendar che mostra le date selezionate
- Wrapped in Popover shadcn
- Locale italiano con `date-fns/locale/it`

---

### Dettagli tecnici

- **Nessuna migrazione DB** necessaria: tutto si basa sulla tabella `orders` gia' strutturata e popolata dalle fasi precedenti
- **RLS**: La policy esistente "Coaches can manage order_payments" copre gia' SELECT per i coach sui propri ordini
- **Formattazione importi**: `(amount_cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })`
- **Empty state**: Componente `empty-state.tsx` gia' esistente, usato quando non ci sono ordini da mostrare
- **Responsive**: Feed in lista verticale su mobile, KPI cards in griglia 1->3 colonne con breakpoint `grid-cols-1 sm:grid-cols-3`