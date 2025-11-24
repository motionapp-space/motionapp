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

  let query = supabase
    .from("training_sessions")
    .select(`
      *,
      clients (
        first_name,
        last_name
      )
    `)
    .eq("coach_id", user.id)
    .order("started_at", { ascending: false, nullsFirst: false });

  if (filters.client_id) {
    query = query.eq("client_id", filters.client_id);
  }
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

  return (data || []).map((session: any) => {
    const clients = session.clients as any;
    return {
      ...session,
      client_name: clients
        ? `${clients.first_name} ${clients.last_name}`
        : "Unknown",
    };
  });
}

export async function getSession(id: string): Promise<TrainingSessionWithClient> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("training_sessions")
    .select(`
      *,
      clients (
        first_name,
        last_name
      )
    `)
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Session not found");

  const clients = (data as any).clients;
  return {
    ...data,
    client_name: clients
      ? `${clients.first_name} ${clients.last_name}`
      : "Unknown",
  } as TrainingSessionWithClient;
}

export async function createSession(input: CreateSessionInput): Promise<TrainingSession> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("training_sessions")
    .insert({
      ...input,
      coach_id: user.id,
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

export async function getActiveSession(): Promise<TrainingSessionWithClient | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("training_sessions")
    .select(`
      *,
      clients (
        first_name,
        last_name
      )
    `)
    .eq("coach_id", user.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const clients = (data as any).clients;
  return {
    ...data,
    client_name: clients
      ? `${clients.first_name} ${clients.last_name}`
      : "Unknown",
  } as TrainingSessionWithClient;
}
