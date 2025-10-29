import { supabase } from "@/integrations/supabase/client";
import type { Event, EventWithClient, CreateEventInput, UpdateEventInput, EventsFilters } from "../types";

export async function listEvents(filters: EventsFilters = {}): Promise<EventWithClient[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let query = supabase
    .from("events")
    .select(`
      *,
      clients!events_client_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq("coach_id", user.id)
    .order("start_at", { ascending: true });

  if (filters.start_date) {
    query = query.gte("start_at", filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte("start_at", filters.end_date);
  }
  if (filters.client_id) {
    query = query.eq("client_id", filters.client_id);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((event: any) => {
    const clients = event.clients as any;
    return {
      ...event,
      client_name: clients 
        ? `${clients.first_name} ${clients.last_name}`
        : "Unknown",
    };
  });
}

export async function getEventById(id: string): Promise<EventWithClient> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      clients!events_client_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Event not found");

  const clients = (data as any).clients;
  return {
    ...data,
    client_name: clients 
      ? `${clients.first_name} ${clients.last_name}`
      : "Unknown",
  } as EventWithClient;
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("events")
    .insert({
      ...input,
      coach_id: user.id,
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      clients!events_client_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq("client_id", clientId)
    .eq("coach_id", user.id)
    .order("start_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((event: any) => {
    const clients = event.clients as any;
    return {
      ...event,
      client_name: clients 
        ? `${clients.first_name} ${clients.last_name}`
        : "Unknown",
    };
  });
}

export async function getNextAppointment(clientId: string): Promise<EventWithClient | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      clients!events_client_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq("client_id", clientId)
    .eq("coach_id", user.id)
    .gte("start_at", now)
    .order("start_at", { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  const clients = (data as any).clients;
  return {
    ...data,
    client_name: clients 
      ? `${clients.first_name} ${clients.last_name}`
      : "Unknown",
  } as EventWithClient;
}

export async function getLastAppointment(clientId: string): Promise<EventWithClient | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      clients!events_client_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq("client_id", clientId)
    .eq("coach_id", user.id)
    .lt("end_at", now)
    .order("end_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  const clients = (data as any).clients;
  return {
    ...data,
    client_name: clients 
      ? `${clients.first_name} ${clients.last_name}`
      : "Unknown",
  } as EventWithClient;
}
