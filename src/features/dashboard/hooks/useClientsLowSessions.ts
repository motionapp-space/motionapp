import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientLowSessions {
  client_id: string;
  first_name: string;
  last_name: string;
  remaining: number;
  coach_client_id: string;
}

async function fetchClientsLowSessions(userId: string): Promise<ClientLowSessions[]> {
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", userId)
    .eq("status", "active");

  if (!coachClients?.length) return [];

  const ccIds = coachClients.map((cc) => cc.id);

  // Get active packages with low remaining sessions
  const { data: packages } = await supabase
    .from("package")
    .select("coach_client_id, total_sessions, consumed_sessions")
    .in("coach_client_id", ccIds)
    .eq("usage_status", "active");

  if (!packages?.length) return [];

  // Aggregate remaining per coach_client
  const remainingMap = new Map<string, number>();
  for (const pkg of packages) {
    const remaining = pkg.total_sessions - pkg.consumed_sessions;
    const current = remainingMap.get(pkg.coach_client_id) ?? 0;
    remainingMap.set(pkg.coach_client_id, current + remaining);
  }

  // Filter <= 2 remaining
  const lowCcIds = Array.from(remainingMap.entries())
    .filter(([, r]) => r <= 2)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);

  if (!lowCcIds.length) return [];

  const ccToClient = new Map(coachClients.map((cc) => [cc.id, cc.client_id]));
  const clientIds = lowCcIds.map(([ccId]) => ccToClient.get(ccId)!).filter(Boolean);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .in("id", clientIds);

  const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

  return lowCcIds.map(([ccId, remaining]) => {
    const clientId = ccToClient.get(ccId)!;
    const client = clientMap.get(clientId);
    return {
      client_id: clientId,
      first_name: client?.first_name ?? "",
      last_name: client?.last_name ?? "",
      remaining,
      coach_client_id: ccId,
    };
  });
}

export function useClientsLowSessions() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "clientsLowSessions", userId],
    queryFn: () => fetchClientsLowSessions(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}
