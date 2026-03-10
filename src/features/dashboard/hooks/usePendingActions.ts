import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PendingAction {
  type: string;
  count: number;
  label: string;
  navigateTo: string;
}

async function fetchPendingActions(userId: string): Promise<PendingAction[]> {
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", userId);

  if (!coachClients?.length) return [];

  const ccIds = coachClients.map((cc) => cc.id);

  const [pendingRes, counterRes, unpaidRes] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("id", { count: "exact", head: true })
      .in("coach_client_id", ccIds)
      .eq("status", "PENDING"),
    supabase
      .from("booking_requests")
      .select("id", { count: "exact", head: true })
      .in("coach_client_id", ccIds)
      .eq("status", "COUNTER_PROPOSED"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("coach_client_id", ccIds)
      .in("status", ["draft", "due"]),
  ]);

  const actions: PendingAction[] = [];

  const pending = pendingRes.count ?? 0;
  if (pending > 0) {
    actions.push({
      type: "booking_pending",
      count: pending,
      label: `${pending} ${pending === 1 ? "richiesta di prenotazione da gestire" : "richieste di prenotazione da gestire"}`,
      navigateTo: "/calendar/manage",
    });
  }

  const counter = counterRes.count ?? 0;
  if (counter > 0) {
    actions.push({
      type: "booking_counter",
      count: counter,
      label: `${counter} ${counter === 1 ? "controproposta in attesa di conferma" : "controproposte in attesa di conferma"}`,
      navigateTo: "/calendar/manage",
    });
  }

  const unpaid = unpaidRes.count ?? 0;
  if (unpaid > 0) {
    actions.push({
      type: "payments_unpaid",
      count: unpaid,
      label: `${unpaid} ${unpaid === 1 ? "pagamento da registrare" : "pagamenti da registrare"}`,
      navigateTo: "/payments",
    });
  }

  return actions;
}

export function usePendingActions() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "pendingActions", userId],
    queryFn: () => fetchPendingActions(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
