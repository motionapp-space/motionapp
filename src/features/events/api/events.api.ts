import { supabase } from "@/integrations/supabase/client";
import type { Event, EventWithClient, CreateEventInput, UpdateEventInput, EventsFilters } from "../types";
import { getCoachClientId } from "@/lib/coach-client";

export async function listEvents(filters: EventsFilters = {}): Promise<EventWithClient[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get coach_clients for this coach
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", user.id);

  if (!coachClients || coachClients.length === 0) return [];

  let coachClientIds = coachClients.map(cc => cc.id);

  // If filtering by client_id, find the specific coach_client_id
  if (filters.client_id) {
    const ccForClient = coachClients.find(cc => cc.client_id === filters.client_id);
    if (!ccForClient) return [];
    coachClientIds = [ccForClient.id];
  }

  let query = supabase
    .from("events")
    .select("*")
    .in("coach_client_id", coachClientIds)
    .or("session_status.is.null,session_status.neq.canceled")
    .order("start_at", { ascending: true });

  if (filters.start_date) {
    query = query.gte("start_at", filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte("start_at", filters.end_date);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Get client names
  const clientIds = coachClients.map(cc => cc.client_id);
  const { data: clients } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .in("id", clientIds);

  const clientMap = new Map(clients?.map(c => [c.id, c]) || []);
  const ccMap = new Map(coachClients.map(cc => [cc.id, cc.client_id]));

  return (data || []).map((event: any) => {
    const clientId = ccMap.get(event.coach_client_id);
    const client = clientId ? clientMap.get(clientId) : null;
    return {
      ...event,
      client_name: client ? `${client.first_name} ${client.last_name}` : "Unknown",
    };
  });
}

export async function getEventById(id: string): Promise<EventWithClient> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Event not found");

  // Get coach_client details
  const { data: cc } = await supabase
    .from("coach_clients")
    .select("client_id")
    .eq("id", data.coach_client_id)
    .single();

  const { data: client } = await supabase
    .from("clients")
    .select("first_name, last_name")
    .eq("id", cc?.client_id)
    .single();

  return {
    ...data,
    client_name: client ? `${client.first_name} ${client.last_name}` : "Unknown",
  } as EventWithClient;
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...input,
      source: input.source || 'manual',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Event;
}

export async function updateEvent(id: string, input: UpdateEventInput): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Event;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getClientEvents(clientId: string): Promise<EventWithClient[]> {
  return listEvents({ client_id: clientId });
}

export async function getNextAppointment(clientId: string): Promise<EventWithClient | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const coachClientId = await getCoachClientId(clientId);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("coach_client_id", coachClientId)
    .or("session_status.is.null,session_status.neq.canceled")
    .gte("start_at", now)
    .order("start_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  const { data: cc } = await supabase
    .from("coach_clients")
    .select("client_id")
    .eq("id", data.coach_client_id)
    .single();

  const { data: client } = await supabase
    .from("clients")
    .select("first_name, last_name")
    .eq("id", cc?.client_id)
    .single();

  return {
    ...data,
    client_name: client ? `${client.first_name} ${client.last_name}` : "Unknown",
  } as EventWithClient;
}

export async function getLastAppointment(clientId: string): Promise<EventWithClient | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const coachClientId = await getCoachClientId(clientId);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("coach_client_id", coachClientId)
    .or("session_status.is.null,session_status.neq.canceled")
    .lt("end_at", now)
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  const { data: cc } = await supabase
    .from("coach_clients")
    .select("client_id")
    .eq("id", data.coach_client_id)
    .single();

  const { data: client } = await supabase
    .from("clients")
    .select("first_name, last_name")
    .eq("id", cc?.client_id)
    .single();

  return {
    ...data,
    client_name: client ? `${client.first_name} ${client.last_name}` : "Unknown",
  } as EventWithClient;
}

export async function getUpcomingCoachEvent(): Promise<EventWithClient | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get all coach_client_ids for this coach
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", user.id);

  if (!coachClients || coachClients.length === 0) return null;

  const now = new Date();
  const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
  
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("coach_client_id", coachClients.map(cc => cc.id))
    .or("session_status.is.null,session_status.neq.canceled")
    .gte("start_at", now.toISOString())
    .lte("start_at", fifteenMinutesLater.toISOString())
    .order("start_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const cc = coachClients.find(c => c.id === data.coach_client_id);
  const { data: client } = await supabase
    .from("clients")
    .select("first_name, last_name")
    .eq("id", cc?.client_id)
    .single();

  return {
    ...data,
    client_name: client ? `${client.first_name} ${client.last_name}` : "Unknown",
  } as EventWithClient;
}
