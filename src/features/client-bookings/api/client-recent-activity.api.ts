/**
 * API for fetching recent activity (declined/cancelled bookings and events)
 */
import { supabase } from "@/integrations/supabase/client";
import { getClientCoachClientId } from "@/lib/coach-client";
import { subDays } from "date-fns";

export type RecentActivityType = 'declined_request' | 'coach_canceled_event' | 'client_canceled_request';

export interface RecentActivityItem {
  id: string;
  activityType: RecentActivityType;
  date: string;        // updated_at for activity timing
  originalDate: string; // startAt/requested time
  title: string;
}

/**
 * Get recent activity for the client (last 30 days)
 * Includes: DECLINED requests, CANCELED_BY_CLIENT requests, canceled events
 */
export async function getClientRecentActivity(): Promise<RecentActivityItem[]> {
  const { coachClientId } = await getClientCoachClientId();
  const thirtyDaysAgo = subDays(new Date(), 30);

  // Fetch declined/cancelled booking requests
  const { data: requests, error: requestsError } = await supabase
    .from("booking_requests")
    .select("id, requested_start_at, status, updated_at")
    .eq("coach_client_id", coachClientId)
    .in("status", ["DECLINED", "CANCELED_BY_CLIENT"])
    .gte("updated_at", thirtyDaysAgo.toISOString())
    .order("updated_at", { ascending: false })
    .limit(10);

  if (requestsError) throw requestsError;

  // Fetch cancelled events
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, start_at, updated_at, session_status")
    .eq("coach_client_id", coachClientId)
    .eq("session_status", "canceled")
    .gte("updated_at", thirtyDaysAgo.toISOString())
    .order("updated_at", { ascending: false })
    .limit(10);

  if (eventsError) throw eventsError;

  const activity: RecentActivityItem[] = [];

  // Map requests
  for (const req of requests || []) {
    activity.push({
      id: req.id,
      activityType: req.status === 'DECLINED' ? 'declined_request' : 'client_canceled_request',
      date: req.updated_at,
      originalDate: req.requested_start_at,
      title: req.status === 'DECLINED' ? 'Richiesta rifiutata' : 'Richiesta annullata'
    });
  }

  // Map events
  for (const evt of events || []) {
    activity.push({
      id: evt.id,
      activityType: 'coach_canceled_event',
      date: evt.updated_at,
      originalDate: evt.start_at,
      title: 'Appuntamento annullato'
    });
  }

  // Sort by date descending and take top 5
  return activity
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}
