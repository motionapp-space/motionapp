import { supabase } from "@/integrations/supabase/client";
import type { SessionStatus, SessionSource, ExerciseActual } from "@/features/sessions/types";

export interface ClientSession {
  id: string;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  source: SessionSource;
  plan_id: string | null;
  day_id: string | null;
}

export async function getClientSessions(clientId: string): Promise<ClientSession[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, status, started_at, ended_at, source, plan_id, day_id")
    .eq("client_id", clientId)
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data || []) as ClientSession[];
}

export async function getClientSessionActuals(sessionId: string): Promise<ExerciseActual[]> {
  const { data, error } = await supabase
    .from("exercise_actuals")
    .select("*")
    .eq("session_id", sessionId)
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return (data || []) as ExerciseActual[];
}
