

## Pagamento Parziale Reale — RPC Bulletproof + Dialog + Reset + Hardening Finale

### Panoramica

Implementare il flusso completo di pagamento parziale end-to-end: due nuove RPC backend hardened, due nuovi hook React, un Dialog modale per registrare importi editabili, aggiornamento feed item con CTA e menu reset. Include tutte le fix di sicurezza e i 3 patch finali di hardening.

---

### 1. Migrazione Database — Due nuove RPC

**`register_order_payment(p_order_id, p_amount_cents)`**
- `SECURITY DEFINER` con `SET search_path = public`
- `FOR UPDATE` per race safety
- Ownership check via join `coach_clients.coach_id = auth.uid()`
- Guard:
  - `p_amount_cents` nullo o <= 0 -> errore
  - Ordine non trovato -> errore
  - Status in canceled/refunded/void -> errore
  - **Ordine gratuito** (`amount_cents <= 0`) -> errore "cannot register payment for free order"
  - **Gia' fully paid** (`paid_amount_cents >= amount_cents`) -> errore "order already fully paid"
- Clamp: `paid_amount_cents = LEAST(amount_cents, paid_amount_cents + p_amount_cents)`
- `paid_at = now()`
- Status allineato:
  - fully paid (`v_new_paid >= amount_cents`) -> `status = 'paid'`
  - parziale -> `status = 'due'`

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

#### RPC SQL — `register_order_payment`

```text
create or replace function public.register_order_payment(
  p_order_id uuid,
  p_amount_cents integer
) returns public.orders
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders;
  v_new_paid integer;
  v_is_owner boolean;
begin
  -- Input validation
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'amount must be > 0';
  end if;

  -- Lock row
  select * into v_order from public.orders
  where id = p_order_id for update;

  if not found then raise exception 'order not found'; end if;

  -- Status guard
  if v_order.status in ('canceled', 'refunded', 'void') then
    raise exception 'cannot register payment for canceled/refunded/void order';
  end if;

  -- Free order guard
  if v_order.amount_cents <= 0 then
    raise exception 'cannot register payment for free order';
  end if;

  -- Already fully paid guard (idempotency)
  if v_order.paid_amount_cents >= v_order.amount_cents then
    raise exception 'order already fully paid';
  end if;

  -- Ownership check
  select exists (
    select 1 from public.coach_clients cc
    where cc.id = v_order.coach_client_id and cc.coach_id = auth.uid()
  ) into v_is_owner;
  if not v_is_owner then raise exception 'not allowed'; end if;

  -- Clamp and update
  v_new_paid := least(v_order.amount_cents, coalesce(v_order.paid_amount_cents, 0) + p_amount_cents);

  update public.orders set
    paid_amount_cents = v_new_paid,
    paid_at = now(),
    status = case when v_new_paid >= v_order.amount_cents then 'paid' else 'due' end
  where id = p_order_id
  returning * into v_order;

  return v_order;
end; $$;
```

#### RPC SQL — `reset_order_payment`

```text
create or replace function public.reset_order_payment(
  p_order_id uuid
) returns public.orders
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders;
  v_is_owner boolean;
begin
  select * into v_order from public.orders
  where id = p_order_id for update;

  if not found then raise exception 'order not found'; end if;

  if v_order.status in ('canceled', 'refunded', 'void') then
    raise exception 'cannot reset payment for canceled/refunded/void order';
  end if;

  select exists (
    select 1 from public.coach_clients cc
    where cc.id = v_order.coach_client_id and cc.coach_id = auth.uid()
  ) into v_is_owner;
  if not v_is_owner then raise exception 'not allowed'; end if;

  update public.orders set
    paid_amount_cents = 0,
    paid_at = null,
    status = case when v_order.status = 'paid' then 'due' else v_order.status end
  where id = p_order_id
  returning * into v_order;

  return v_order;
end; $$;
```

#### `useRegisterPayment.ts`

- `useMutation` che chiama `supabase.rpc('register_order_payment', { p_order_id, p_amount_cents })`
- `onSuccess`: `queryClient.invalidateQueries({ queryKey: ["payments"] })`, toast "Pagamento registrato"
- `onError`: toast con messaggio errore dal backend

Nota: le KPI sono derivate da `useMemo` sugli stessi `orders` (queryKey `["payments"]`), quindi un singolo `invalidateQueries` aggiorna sia feed che KPI automaticamente.

#### `useResetPayment.ts`

- `useMutation` che chiama `supabase.rpc('reset_order_payment', { p_order_id })`
- `onSuccess`: stessa invalidazione, toast "Pagamento annullato"

#### `RegisterPaymentDialog.tsx`

- Props: `open`, `onOpenChange`, `order: PaymentOrder`
- Usa `useRegisterPayment` internamente
- Campo importo tramite `PriceInput` (gia' nel progetto, lavora in centesimi, supporta virgola e punto nativamente)
- Default = residuo (`Math.max(0, amount_cents - paid_amount_cents)`)
- Validazioni:
  - Min 1 cent
  - Max = residuo (no overpay da UI)
  - CTA disabilitata se importo invalido o 0
- Copy dinamica sotto il campo:
  - importo == residuo -> "Segnerai l'ordine come interamente pagato"
  - importo < residuo -> "Pagamento parziale: resteranno X,XX EUR da incassare"
- Header: "Registra pagamento"
- Subtitle: nome cliente + titolo ordine
- Helper sotto campo: "Residuo: X,XX EUR"
- Footer: "Annulla" (outline) + "Conferma pagamento" (default)
- Nessun campo data (backend usa `now()`)

#### `PaymentFeedItem.tsx`

- Rimuovere props `onMarkPaid` e `isPending`
- Se outstanding (residuo > 0):
  - Button ghost "Registra pagamento" apre `RegisterPaymentDialog` (stato locale)
- Se fully paid (residuo == 0, escludendo ordini gratuiti con amount=0):
  - Button ghost con icona `MoreVertical` -> `DropdownMenu` con "Ripristina come da incassare"
  - Click -> `AlertDialog` conferma -> chiama `useResetPayment`
- Padding da `py-3 px-4` a `py-4 px-6`
- Aggiungere `tabular-nums` al blocco importi destro

#### `PaymentFeed.tsx`

- Rimuovere `useMarkOrderPaid` e relative props
- `PaymentFeedItem` non riceve piu' `onMarkPaid`/`isPending`
- Wrappare lista in contenitore `rounded-2xl border border-border overflow-hidden`

#### `PaymentKPICards.tsx`

- Nuova prop `activeFilter?: "outstanding" | "paidInMonth" | null`
- Card base: aggiungere `hover:bg-muted/20`
- Card attiva: `border-foreground ring-1 ring-foreground/10 bg-foreground/5`
- Micro-label in alto a destra di ogni card:
  - Default: testo "Filtra" in `text-xs text-muted-foreground`
  - Attivo: badge "Filtro attivo" in `text-xs bg-foreground/10 text-foreground rounded-full px-2 py-0.5`

#### `Payments.tsx`

- Passare `activeFilter` derivato da `kpiFilter` alle KPI cards

---

### Edge cases

| Caso | Comportamento |
|------|--------------|
| Double click | `FOR UPDATE` nel DB previene race condition |
| Overpay da UI | Input clampato a max = residuo, CTA disabilitata |
| Overpay da DB | `LEAST()` nel SQL clamp a `amount_cents` |
| Ordine gia' fully paid | RPC rifiuta: "order already fully paid" |
| Ordine gratuito (amount=0) | RPC rifiuta: "cannot register payment for free order" |
| Reset ordine paid | Status torna a `'due'` |
| Reset ordine gia' due | Status resta invariato |
| Pagamento parziale | Status = `'due'` (coerente) |
| canceled/refunded/void | RPC rifiuta con eccezione |
| Input con virgola (12,50) | Gestito nativamente da `PriceInput` |

---

### Cose che NON cambiano

- `usePaymentKPIs.ts` (derivato da stessi orders, aggiornato via invalidazione)
- `usePayments.ts`
- `payments.api.ts`
- `PaymentFilters.tsx`
- `types.ts`
- `mark_order_as_paid` RPC (backward compat)
- `PriceInput` component (gia' supporta virgola/punto)
