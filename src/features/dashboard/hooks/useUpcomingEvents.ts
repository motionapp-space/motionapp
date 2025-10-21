import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, subDays, startOfDay, endOfDay } from "date-fns";

interface EventWithClient {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  client_name: string;
  client_id: string;
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

  // Fetch upcoming events (next 7 days)
  const { data: upcomingEvents, error: upcomingError } = await supabase
    .from("events")
    .select(`
      id,
      title,
      start_at,
      end_at,
      client_id,
      clients!inner(first_name, last_name)
    `)
    .eq("coach_id", user.id)
    .gte("start_at", todayStart.toISOString())
    .lte("start_at", next7Days.toISOString())
    .order("start_at", { ascending: true });

  if (upcomingError) throw upcomingError;

  // Fetch previous week events for comparison
  const { data: prevEvents, error: prevError } = await supabase
    .from("events")
    .select("id")
    .eq("coach_id", user.id)
    .gte("start_at", prev7DaysStart.toISOString())
    .lte("start_at", prev7DaysEnd.toISOString());

  if (prevError) throw prevError;

  const events: EventWithClient[] = (upcomingEvents || []).map((event: any) => ({
    id: event.id,
    title: event.title,
    start_at: event.start_at,
    end_at: event.end_at,
    client_id: event.client_id,
    client_name: `${event.clients.first_name} ${event.clients.last_name}`,
  }));

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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
