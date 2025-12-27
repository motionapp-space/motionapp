import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, subDays, startOfDay, endOfDay } from "date-fns";

interface EventWithClient {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  client_name: string;
  coach_client_id: string;
}

interface UpcomingEventsData {
  events: EventWithClient[];
  count: number;
  change: number;
}

async function fetchUpcomingEvents(): Promise<UpcomingEventsData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date();
  const todayStart = startOfDay(now);
  const next7Days = endOfDay(addDays(now, 7));
  const prev7DaysStart = startOfDay(subDays(now, 7));
  const prev7DaysEnd = endOfDay(now);

  // Get coach_clients for this coach
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", user.id);

  if (!coachClients || coachClients.length === 0) {
    return { events: [], count: 0, change: 0 };
  }

  // Get clients for names
  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .in("id", coachClients.map(cc => cc.client_id));

  const clientMap = new Map(clientsData?.map(c => [c.id, c]) || []);
  const ccToClientMap = new Map(coachClients.map(cc => [cc.id, cc.client_id]));

  // Fetch upcoming events (next 7 days)
  const { data: upcomingEvents, error: upcomingError } = await supabase
    .from("events")
    .select("id, title, start_at, end_at, coach_client_id")
    .in("coach_client_id", coachClients.map(cc => cc.id))
    .gte("start_at", todayStart.toISOString())
    .lte("start_at", next7Days.toISOString())
    .order("start_at", { ascending: true });

  if (upcomingError) throw upcomingError;

  // Fetch previous week events for comparison
  const { data: prevEvents, error: prevError } = await supabase
    .from("events")
    .select("id")
    .in("coach_client_id", coachClients.map(cc => cc.id))
    .gte("start_at", prev7DaysStart.toISOString())
    .lte("start_at", prev7DaysEnd.toISOString());

  if (prevError) throw prevError;

  const events: EventWithClient[] = (upcomingEvents || []).map((event) => {
    const clientId = ccToClientMap.get(event.coach_client_id);
    const client = clientId ? clientMap.get(clientId) : null;
    return {
      id: event.id,
      title: event.title,
      start_at: event.start_at,
      end_at: event.end_at,
      coach_client_id: event.coach_client_id,
      client_name: client ? `${client.first_name} ${client.last_name}` : 'Cliente',
    };
  });

  const currentCount = events.length;
  const previousCount = (prevEvents || []).length;

  const change = previousCount > 0 
    ? ((currentCount - previousCount) / previousCount) * 100 
    : (currentCount > 0 ? 100 : 0);

  return {
    events,
    count: currentCount,
    change
  };
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ["upcomingEvents"],
    queryFn: fetchUpcomingEvents,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}
