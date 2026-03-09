import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays } from "date-fns";

export interface InactiveClient {
  client_id: string;
  first_name: string;
  last_name: string;
  days_since_last_event: number;
  coach_client_id: string;
}

async function fetchInactiveClients(userId: string): Promise<InactiveClient[]> {
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", userId)
    .eq("status", "active");

  if (!coachClients?.length) return [];

  const ccIds = coachClients.map((cc) => cc.id);

  // Get most recent event per coach_client
  const { data: events } = await supabase
    .from("events")
    .select("coach_client_id, start_at")
    .in("coach_client_id", ccIds)
    .is("canceled_by", null)
    .order("start_at", { ascending: false });

  if (!events?.length) return [];

  const now = new Date();
  const latestPerCc = new Map<string, Date>();
  for (const e of events) {
    if (!latestPerCc.has(e.coach_client_id)) {
      latestPerCc.set(e.coach_client_id, new Date(e.start_at));
    }
  }

  // Filter > 30 days
  const inactive = Array.from(latestPerCc.entries())
    .map(([ccId, lastDate]) => ({ ccId, days: differenceInDays(now, lastDate) }))
    .filter((x) => x.days > 30)
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);

  if (!inactive.length) return [];

  const ccToClient = new Map(coachClients.map((cc) => [cc.id, cc.client_id]));
  const clientIds = inactive.map((x) => ccToClient.get(x.ccId)!).filter(Boolean);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .in("id", clientIds);

  const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

  return inactive.map((x) => {
    const clientId = ccToClient.get(x.ccId)!;
    const client = clientMap.get(clientId);
    return {
      client_id: clientId,
      first_name: client?.first_name ?? "",
      last_name: client?.last_name ?? "",
      days_since_last_event: x.days,
      coach_client_id: x.ccId,
    };
  });
}

export function useInactiveClients() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "inactiveClients", userId],
    queryFn: () => fetchInactiveClients(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}
