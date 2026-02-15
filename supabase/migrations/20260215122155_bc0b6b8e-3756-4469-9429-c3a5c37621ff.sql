
-- RPC: register_order_payment (atomic, race-safe, hardened)
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
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'amount must be > 0';
  end if;

  select * into v_order from public.orders
  where id = p_order_id for update;

  if not found then raise exception 'order not found'; end if;

  if v_order.status in ('canceled', 'refunded', 'void') then
    raise exception 'cannot register payment for canceled/refunded/void order';
  end if;

  if v_order.amount_cents <= 0 then
    raise exception 'cannot register payment for free order';
  end if;

  if v_order.paid_amount_cents >= v_order.amount_cents then
    raise exception 'order already fully paid';
  end if;

  select exists (
    select 1 from public.coach_clients cc
    where cc.id = v_order.coach_client_id and cc.coach_id = auth.uid()
  ) into v_is_owner;
  if not v_is_owner then raise exception 'not allowed'; end if;

  v_new_paid := least(v_order.amount_cents, coalesce(v_order.paid_amount_cents, 0) + p_amount_cents);

  update public.orders set
    paid_amount_cents = v_new_paid,
    paid_at = now(),
    status = case when v_new_paid >= v_order.amount_cents then 'paid' else 'due' end
  where id = p_order_id
  returning * into v_order;

  return v_order;
end; $$;

-- RPC: reset_order_payment (hardened)
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
