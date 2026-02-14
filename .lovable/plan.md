

## Unificazione Pagamenti: Product -> Order -> Asset

### Stato attuale (problemi identificati)

**Due sistemi disconnessi coesistono:**

| Flusso | Come nasce | Dove si traccia il pagamento | UI di gestione |
|--------|-----------|------------------------------|----------------|
| Lezione singola (booking cliente) | RPC `create_event_with_economics_internal` | Tabella `orders` (status: draft -> due -> paid) | Nessuna UI |
| Lezione singola (coach manuale) | INSERT diretto su `events` + nessun ordine creato | Nessun tracciamento | Nessuna |
| Pacchetto | INSERT su `package` | `package.payment_status` (colonna dedicata) | `PaymentStatusDialog` manuale |

**Problemi critici scoperti:**

1. Quando il **coach** crea un evento `single_paid` manualmente, la `createEvent` fa un semplice INSERT nella tabella `events` senza `economic_type` (default `'none'`). L'ordine NON viene creato. Solo il flusso booking-client usa la RPC.
2. La logica package (hold/consume) nel coach flow e' implementata in JS (righe 572-613 e 637-653 di `EventEditorModal`) con chiamate dirette a `createLedgerEntry` e update manuali su `package.on_hold_sessions`, bypassando la RPC.
3. I pacchetti non generano mai un record in `orders` -- il pagamento vive solo in `package.payment_status`.
4. La colonna `orders.product_id` esiste ma non e' mai popolata.

### Schema DB: gia' pronto

La tabella `orders` ha gia':
- `package_id` (uuid, nullable) con vincolo `chk_order_kind_refs` che supporta `kind = 'package_purchase'` con `package_id IS NOT NULL`
- `product_id` (uuid, nullable) 
- `status` CHECK: `draft`, `due`, `paid`, `canceled`, `refunded`, `refund_pending`

Non servono migrazioni strutturali alla tabella `orders`.

### Piano di implementazione

---

#### Fase 1: Unificare il flusso coach -> RPC (eliminare INSERT diretto)

**Obiettivo**: il coach DEVE usare la RPC `create_event_with_economics_internal` invece di `createEvent` (INSERT diretto) quando crea lezioni a pagamento o con pacchetto.

**1.1 - Modificare `EventEditorModal.tsx` per usare la RPC**

Il flusso di creazione evento dal coach deve:
- Per `lessonType === "single"`: chiamare `supabase.rpc('create_event_with_economics_internal', { p_economic_type: 'single_paid', p_amount_cents: price, ... })`
- Per `lessonType === "package"`: chiamare `supabase.rpc('create_event_with_economics_internal', { p_economic_type: 'package', p_package_id: selectedPackageId, ... })`
- Per `lessonType === "free"`: chiamare `supabase.rpc('create_event_with_economics_internal', { p_economic_type: 'free', ... })`
- Per nessun tipo: continuare con `createEvent` plain INSERT (default `economic_type = 'none'`)

Questo elimina:
- La logica JS per `createLedgerEntry` + update manuale `on_hold_sessions` (righe 572-613)
- La chiamata a `handleEventConfirm` (righe 637-653)
- L'import di `handleEventConfirm` e `createLedgerEntry`

**1.2 - Gestione ricorrenze con RPC**

Per le ricorrenze, la RPC supporta gia' `p_series_id` e `p_series_request_id`. Ogni occorrenza verra' creata chiamando la RPC singolarmente (come ora, ma con la RPC invece dell'INSERT diretto).

Per `lessonType === "package"` con ricorrenza: la RPC gestisce atomicamente il HOLD_CREATE per ogni evento, eliminando il loop JS attuale.

Per `lessonType === "single"` con ricorrenza: la RPC creera' un ordine separato per ogni occorrenza.

**1.3 - Popolare `product_id` nella RPC**

Modificare la RPC `create_event_with_economics_internal` per accettare un parametro opzionale `p_product_id` e salvarlo nell'ordine creato. Il frontend passera' l'ID del prodotto `single_session` o `session_pack` corrispondente.

---

#### Fase 2: Ordine alla creazione del pacchetto

**Obiettivo**: quando il coach crea un pacchetto, generare automaticamente un ordine `kind = 'package_purchase'`.

**2.1 - Trigger DB `on_package_insert_create_order`**

Creare un trigger AFTER INSERT su `package` che:

```text
Per ogni nuovo pacchetto con is_single_technical = false E price_total_cents > 0:
  INSERT INTO orders (
    coach_client_id,
    package_id,
    kind = 'package_purchase',
    status = 'due',
    amount_cents = NEW.price_total_cents,
    currency_code = NEW.currency_code,
    due_at = NOW(),
    product_id = (opzionale, lookup da products matching credits_amount)
  )
```

Se `payment_status` del pacchetto e' gia' `'paid'` al momento della creazione, l'ordine nasce con `status = 'paid'` e `paid_at = NOW()`.

**2.2 - Backfill dei pacchetti esistenti**

Script SQL una tantum per creare ordini per i 2 pacchetti attivi esistenti:

```text
Per ogni pacchetto senza ordine corrispondente:
  - package.payment_status = 'unpaid' -> order.status = 'due'
  - package.payment_status = 'paid' -> order.status = 'paid'
  - package.payment_status = 'partial' -> order.status = 'due' (amount = totale)
```

---

#### Fase 3: RPC `mark_order_as_paid`

**3.1 - Creare la funzione DB**

```text
mark_order_as_paid(p_order_id uuid, p_external_payment_id text DEFAULT NULL)
  1. UPDATE orders SET status = 'paid', paid_at = NOW(), external_payment_id = p_external_payment_id
     WHERE id = p_order_id AND status IN ('draft', 'due')
  2. Se order.kind = 'package_purchase' E order.package_id IS NOT NULL:
     UPDATE package SET payment_status = 'paid' WHERE package_id = order.package_id
  3. RETURN: l'ordine aggiornato
```

**3.2 - Deprecare l'aggiornamento diretto di `package.payment_status`**

Gradualmente, la UI passera' a chiamare `mark_order_as_paid` sull'ordine collegato al pacchetto, invece di aggiornare direttamente `package.payment_status`.

---

#### Fase 4: Pulizia codice morto (conseguenza delle fasi 1-3)

Dopo la migrazione alla RPC:

| File / Blocco | Azione |
|--------------|--------|
| `EventEditorModal` righe 572-613 (loop ledger ricorrenze package) | Rimuovere - gestito dalla RPC |
| `EventEditorModal` righe 637-653 (handleEventConfirm singolo) | Rimuovere - gestito dalla RPC |
| Import `handleEventConfirm` da calendar-integration.api | Rimuovere |
| Import `createLedgerEntry` da ledger.api | Rimuovere |
| `PaymentStatusDialog` | Mantenere temporaneamente, ma la fonte autorevole sara' `orders` |

---

#### Fase 5 (futura): Hub Pagamenti UI

Questa fase e' fuori scope per ora, ma il fondamento e':

- Query unica: `SELECT * FROM orders WHERE status IN ('draft', 'due') ORDER BY created_at DESC`
- Ogni riga mostra: cliente, tipo (lezione singola / pacchetto), importo, data
- Azione: "Segna come pagato" -> chiama `mark_order_as_paid`

---

### Sequenza di implementazione consigliata

1. **Fase 2** (trigger + backfill) -- zero impatto sul frontend, allinea subito i dati
2. **Fase 3** (RPC mark_order_as_paid) -- abilita il futuro Hub Pagamenti
3. **Fase 1** (coach usa RPC) -- il cambio piu' rischioso, da testare bene
4. **Fase 4** (pulizia) -- conseguenza naturale della Fase 1

### Rischi e mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| La RPC `create_event_with_economics_internal` non gestisce le ricorrenze in batch | Gia' verificato: ogni occorrenza si crea singolarmente, la RPC ha idempotency via `series_request_id + start_at` |
| Doppio ordine per pacchetti (trigger + codice) | Il trigger si attiva solo su INSERT nella tabella `package`, non interferisce con il flusso ordini delle lezioni singole |
| `package.payment_status` diventa stale | Il trigger `mark_order_as_paid` sincronizza automaticamente entrambe le tabelle durante la transizione |

