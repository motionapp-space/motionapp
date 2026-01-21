import { supabase } from "@/integrations/supabase/client";
import type {
  TrainingSession,
  TrainingSessionWithClient,
  CreateSessionInput,
  UpdateSessionInput,
  SessionsFilters,
} from "../types";

export async function listSessions(filters: SessionsFilters = {}): Promise<TrainingSessionWithClient[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get coach_clients for this coach
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", user.id);

  if (!coachClients || coachClients.length === 0) return [];

  let coachClientIds = coachClients.map(cc => cc.id);

  // If filtering by coach_client_id, use that directly
  if (filters.coach_client_id) {
    coachClientIds = [filters.coach_client_id];
  }

  let query = supabase
    .from("training_sessions")
    .select("*")
    .in("coach_client_id", coachClientIds)
    .order("started_at", { ascending: false, nullsFirst: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.start_date) {
    query = query.gte("started_at", filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte("started_at", filters.end_date);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Filter out autonomous sessions that are still in progress
  // Coach should only see autonomous sessions after they're completed
  const filteredData = (data || []).filter((session: any) => {
    const isAutonomousInProgress = 
      session.source === 'autonomous' && session.status === 'in_progress';
    return !isAutonomousInProgress;
  });

  // Get client details
  const clientIds = coachClients.map(cc => cc.client_id);
  const { data: clients } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .in("id", clientIds);

  const clientMap = new Map(clients?.map(c => [c.id, c]) || []);
  const ccMap = new Map(coachClients.map(cc => [cc.id, cc.client_id]));

  return filteredData.map((session: any) => {
    const clientId = ccMap.get(session.coach_client_id);
    const client = clientId ? clientMap.get(clientId) : null;
    return {
      ...session,
      client_name: client ? `${client.first_name} ${client.last_name}` : "Unknown",
    };
  });
}

export async function getSession(id: string): Promise<TrainingSessionWithClient> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Session not found");

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
  } as TrainingSessionWithClient;
}

export async function createSession(input: CreateSessionInput): Promise<TrainingSession> {
  const { data, error } = await supabase
    .from("training_sessions")
    .insert({
      coach_client_id: input.coach_client_id,
      plan_id: input.plan_id,
      day_id: input.day_id,
      event_id: input.event_id,
      scheduled_at: input.scheduled_at,
      status: "in_progress",
      started_at: new Date().toISOString(),
      source: input.source || "with_coach",
    })
    .select()
    .single();

  if (error) throw error;
  return data as TrainingSession;
}

export async function updateSession(id: string, input: UpdateSessionInput): Promise<TrainingSession> {
  const { data, error } = await supabase
    .from("training_sessions")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as TrainingSession;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase
    .from("training_sessions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getActiveSession(userId?: string): Promise<TrainingSessionWithClient | null> {
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return null;

  // Get coach_clients for this coach
  const { data: coachClients } = await supabase
    .from("coach_clients")
    .select("id, client_id")
    .eq("coach_id", uid);

  if (!coachClients || coachClients.length === 0) return null;

  // Solo sessioni avviate nelle ultime 12 ore (ignora sessioni "zombie")
  const twelveHoursAgo = new Date();
  twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

  const { data, error } = await supabase
    .from("training_sessions")
    .select("*")
    .in("coach_client_id", coachClients.map(cc => cc.id))
    .eq("status", "in_progress")
    .eq("source", "with_coach") // Only coach-initiated sessions show in sticky bar
    .gte("started_at", twelveHoursAgo.toISOString())
    .order("started_at", { ascending: false })
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
  } as TrainingSessionWithClient;
}
