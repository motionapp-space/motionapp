import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, addHours, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export interface TodayEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  client_name: string;
  client_id: string;
  coach_client_id: string;
  isNext: boolean;
}

async function fetchTodayEvents(userId: string): Promise<TodayEvent[]> {
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();

  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", userId)
    .eq("status", "active");

  if (!coachClients?.length) return [];

  const ccIds = coachClients.map((cc) => cc.id);
  const clientIds = coachClients.map((cc) => cc.client_id);

  const [eventsRes, clientsRes] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, start_at, end_at, coach_client_id")
      .in("coach_client_id", ccIds)
      .gte("start_at", todayStart)
      .lte("start_at", todayEnd)
      .is("canceled_by", null)
      .order("start_at", { ascending: true })
      .limit(6),
    supabase
      .from("clients")
      .select("id, first_name, last_name")
      .in("id", clientIds),
  ]);

  const clientMap = new Map(
    clientsRes.data?.map((c) => [c.id, `${c.first_name} ${c.last_name}`]) ?? []
  );
  const ccToClient = new Map(
    coachClients.map((cc) => [cc.id, cc.client_id])
  );

  const twoHoursFromNow = addHours(now, 2);
  let nextMarked = false;

  return (eventsRes.data ?? []).map((e) => {
    const startDate = new Date(e.start_at);
    const isNext = !nextMarked && startDate > now && startDate <= twoHoursFromNow;
    if (isNext) nextMarked = true;

    const clientId = ccToClient.get(e.coach_client_id) ?? "";
    return {
      id: e.id,
      title: e.title,
      start_at: e.start_at,
      end_at: e.end_at,
      client_name: clientMap.get(clientId) ?? "Cliente",
      client_id: clientId,
      coach_client_id: e.coach_client_id,
      isNext,
    };
  });
}

export function useTodayEvents() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "todayEvents", userId],
    queryFn: () => fetchTodayEvents(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

/** Helper: get sublabel for KPI */
export function getNextEventLabel(events: TodayEvent[] | undefined): string {
  if (!events?.length) return "Giornata libera";
  const next = events.find((e) => e.isNext);
  if (next) return `Prossimo alle ${format(new Date(next.start_at), "HH:mm")}`;
  const first = events[0];
  if (new Date(first.start_at) > new Date()) {
    return `Prossimo alle ${format(new Date(first.start_at), "HH:mm")}`;
  }
  return `${events.length} eventi`;
}
