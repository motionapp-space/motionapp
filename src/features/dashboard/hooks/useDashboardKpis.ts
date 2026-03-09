import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardKpi {
  key: string;
  label: string;
  value: string;
  sublabel: string;
}

async function fetchUnpaidAmount(userId: string): Promise<{ total: number; count: number }> {
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", userId);

  if (!coachClients?.length) return { total: 0, count: 0 };

  const { data: orders } = await supabase
    .from("orders")
    .select("amount_cents, paid_amount_cents")
    .in("coach_client_id", coachClients.map((cc) => cc.id))
    .in("status", ["draft", "due"]);

  if (!orders?.length) return { total: 0, count: 0 };

  const total = orders.reduce((sum, o) => sum + (o.amount_cents - o.paid_amount_cents), 0);
  return { total, count: orders.length };
}

export function useUnpaidKpi() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "unpaidKpi", userId],
    queryFn: () => fetchUnpaidAmount(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
