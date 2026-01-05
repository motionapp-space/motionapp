import { supabase } from "@/integrations/supabase/client";
import { getClientCoachClientId } from "@/lib/coach-client";
import type { SessionStatus, SessionSource, ExerciseActual } from "@/features/sessions/types";

export type PlanDaySnapshot = {
  captured_at?: string;
  plan_id?: string;
  plan_name?: string;
  day_id?: string;
  day_title?: string;
  day_structure?: any;
  warning?: 'PLAN_NOT_FOUND' | 'DAY_NOT_FOUND' | string;
};

export interface ClientSession {
  id: string;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  source: SessionSource;
  plan_id: string | null;
  day_id: string | null;
  plan_day_snapshot: PlanDaySnapshot | null;
}

export async function getClientSessions(): Promise<ClientSession[]> {
  const { coachClientId } = await getClientCoachClientId();

  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, status, started_at, ended_at, source, plan_id, day_id, plan_day_snapshot")
    .eq("coach_client_id", coachClientId)
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
