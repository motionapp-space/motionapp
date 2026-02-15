

## Pagamento Parziale Reale — RPC Bulletproof + Dialog + Reset

### Panoramica

Implementare il flusso completo di pagamento parziale end-to-end con le 3 fix di hardening integrate: status coerente in entrambe le RPC, `search_path` hardened, e ownership check via join.

---

### 1. Migrazione Database — Due nuove RPC

**`register_order_payment(p_order_id, p_amount_cents)`**
- `SECURITY DEFINER` con `SET search_path = public`
- `FOR UPDATE` per race safety
- Ownership check via join `coach_clients.coach_id = auth.uid()`
- Guard: amount > 0, ordine esistente, status non in canceled/refunded/void
- Clamp: `paid_amount_cents = LEAST(amount_cents, paid_amount_cents + p_amount_cents)`
- `paid_at = now()`
- Status allineato:
  - fully paid -> `status = 'paid'`
  - parziale -> `status = 'due'` (normalizza sempre a stato coerente)

**`reset_order_payment(p_order_id)`**
- Stesse protezioni (SECURITY DEFINER, search_path, ownership, guard status)
- `paid_amount_cents = 0`, `paid_at = NULL`
- Status: se era `'paid'` -> torna a `'due'`, altrimenti invariato

La RPC `mark_order_as_paid` esistente resta invariata (backward compat).

---

### 2. File nuovi

```text
src/features/payments/hooks/useRegisterPayment.ts
src/features/payments/hooks/useResetPayment.ts
src/features/payments/components/RegisterPaymentDialog.tsx
```

### 3. File modificati

```text
src/features/payments/components/PaymentFeedItem.tsx
src/features/payments/components/PaymentFeed.tsx
src/features/payments/components/PaymentKPICards.tsx
src/pages/Payments.tsx
```

---

### Sezione tecnica

**`useRegisterPayment.ts`**
- `useMutation` che chiama `supabase.rpc('register_order_payment', { p_order_id, p_amount_cents })`
- `onSuccess`: `queryClient.invalidateQueries({ queryKey: ["payments"] })`, toast "Pagamento registrato"

**`useResetPayment.ts`**
- `useMutation` che chiama `supabase.rpc('reset_order_payment', { p_order_id })`
- `onSuccess`: stessa invalidazione, toast "Pagamento annullato"

**`RegisterPaymentDialog.tsx`**
- Props: `open`, `onOpenChange`, `order: PaymentOrder`
- Usa `useRegisterPayment` internamente
- Campo importo editabile tramite `PriceInput` (gia' esistente nel progetto, lavora in centesimi)
- Default = residuo
- Validazioni: min 1 cent, max = residuo (no overpay)
- Copy dinamica:
  - importo == residuo -> "Segnerai l'ordine come pagato"
  - importo < residuo -> "Pagamento parziale: resteranno X,XX EUR da incassare"
- Header: "Registra pagamento" + sottotitolo cliente e ordine
- Helper sotto campo: "Residuo: X,XX EUR"
- Footer: "Annulla" (ghost) + "Conferma pagamento" (default)
- Nessun campo data (backend usa `now()`)

**`PaymentFeedItem.tsx`**
- Rimuovere props `onMarkPaid` e `isPending`
- Se outstanding (residuo > 0):
  - Button ghost "Registra pagamento" apre `RegisterPaymentDialog` (stato locale `open`)
- Se fully paid (residuo == 0):
  - Button ghost con icona `MoreVertical` -> `DropdownMenu` con "Ripristina come da incassare"
  - Click -> `AlertDialog` conferma -> chiama `useResetPayment`
- Aggiungere `tabular-nums` al blocco importi
- Padding da `py-3 px-4` a `py-4 px-6`

**`PaymentFeed.tsx`**
- Rimuovere `useMarkOrderPaid` e relative props
- Wrappare lista in contenitore `rounded-2xl border border-border overflow-hidden`
- `PaymentFeedItem` non riceve piu' `onMarkPaid`/`isPending` (gestisce tutto internamente)

**`PaymentKPICards.tsx`**
- Nuova prop `activeFilter?: "outstanding" | "paidInMonth" | null`
- Stile attivo: `border-foreground ring-1 ring-foreground/10 bg-foreground/5`
- Micro-label in alto a destra: "Filtra" (default) / "Filtro attivo" (quando selezionato)

**`Payments.tsx`**
- Passare `activeFilter` derivato da `kpiFilter` alle KPI cards

---

### Edge cases

| Caso | Comportamento |
|------|--------------|
| Double click | `FOR UPDATE` nel DB previene race condition |
| Overpay da UI | Input clampato a max = residuo, CTA disabilitata |
| Overpay da DB | `LEAST()` nel SQL clamp a `amount_cents` |
| Reset ordine paid | Status torna a `'due'` (coerente con altre parti del sistema) |
| Reset ordine gia' due | Status resta invariato |
| Pagamento parziale | Status = `'due'` (non `'paid'`) |
| canceled/refunded/void | RPC rifiuta con eccezione |

---

### Cose che NON cambiano

- `usePaymentKPIs.ts` (usa stessa query key `["payments"]`, riceve dati aggiornati via invalidazione)
- `usePayments.ts`
- `payments.api.ts`
- `PaymentFilters.tsx`
- `types.ts`
- `mark_order_as_paid` RPC (resta per backward compat)

