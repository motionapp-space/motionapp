import { supabase } from "@/integrations/supabase/client";
import type { PaymentOrder } from "../types";

export async function fetchPaymentOrders(): Promise<PaymentOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      amount_cents,
      paid_amount_cents,
      currency_code,
      status,
      kind,
      created_at,
      paid_at,
      due_at,
      note,
      event_id,
      package_id,
      coach_client_id,
      coach_clients!fk_order_coach_client (
        client_id,
        clients (
          first_name,
          last_name
        )
      ),
      events!fk_order_event (
        start_at,
        title
      ),
      package!payment_package_id_fkey (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    amount_cents: row.amount_cents,
    paid_amount_cents: row.paid_amount_cents ?? 0,
    currency_code: row.currency_code,
    status: row.status,
    kind: row.kind,
    created_at: row.created_at,
    paid_at: row.paid_at,
    due_at: row.due_at,
    note: row.note,
    event_id: row.event_id,
    package_id: row.package_id,
    coach_client_id: row.coach_client_id,
    client_first_name: row.coach_clients?.clients?.first_name ?? "",
    client_last_name: row.coach_clients?.clients?.last_name ?? "",
    event_start_at: row.events?.start_at ?? null,
    event_title: row.events?.title ?? null,
    package_name: row.package?.name ?? null,
  }));
}
