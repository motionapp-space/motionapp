export interface PaymentOrder {
  id: string;
  amount_cents: number;
  paid_amount_cents: number;
  currency_code: string;
  status: string;
  kind: string;
  created_at: string;
  paid_at: string | null;
  due_at: string | null;
  note: string | null;
  event_id: string | null;
  package_id: string | null;
  coach_client_id: string | null;
  // Joined fields
  client_first_name: string;
  client_last_name: string;
  event_start_at: string | null;
  event_title: string | null;
  package_name: string | null;
}

export type PaymentStatusFilter = "all" | "due" | "paid" | "draft";
