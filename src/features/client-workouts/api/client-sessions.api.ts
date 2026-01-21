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
  // New snapshot format fields
  day?: { id: string; order: number; title: string };
  phases?: any[];
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

export interface ClientSessionWithCounts extends ClientSession {
  completedExercisesCount: number;
}

export async function getClientSessions(): Promise<ClientSessionWithCounts[]> {
  const { coachClientId } = await getClientCoachClientId();

  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select("id, status, started_at, ended_at, source, plan_id, day_id, plan_day_snapshot")
    .eq("coach_client_id", coachClientId)
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(30);

  if (error) throw error;

  const sessionList = (sessions || []) as ClientSession[];
  
  if (sessionList.length === 0) {
    return [];
  }

  // Fetch exercise_actuals for all sessions to count unique groups
  const sessionIds = sessionList.map(s => s.id);
  
  const { data: actuals, error: actualsError } = await supabase
    .from("exercise_actuals")
    .select("session_id, group_id")
    .in("session_id", sessionIds);

  if (actualsError) throw actualsError;

  // Group by session_id and count unique group_ids
  // A group = 1 unit (single exercise, superset, or circuit)
  const countMap = new Map<string, Set<string>>();
  for (const actual of actuals || []) {
    if (!countMap.has(actual.session_id)) {
      countMap.set(actual.session_id, new Set());
    }
    if (actual.group_id) {
      countMap.get(actual.session_id)!.add(actual.group_id);
    }
  }

  return sessionList.map(s => ({
    ...s,
    completedExercisesCount: countMap.get(s.id)?.size || 0
  }));
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
