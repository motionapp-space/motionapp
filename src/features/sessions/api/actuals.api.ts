import { supabase } from "@/integrations/supabase/client";
import type { ExerciseActual, CreateActualInput } from "../types";

export async function listActuals(sessionId: string): Promise<ExerciseActual[]> {
  const { data, error } = await supabase
    .from("exercise_actuals")
    .select("*")
    .eq("session_id", sessionId)
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createActual(sessionId: string, input: CreateActualInput): Promise<ExerciseActual> {
  const { data, error } = await supabase
    .from("exercise_actuals")
    .insert({
      session_id: sessionId,
      ...input,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteActual(id: string): Promise<void> {
  const { error } = await supabase
    .from("exercise_actuals")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getExerciseHistory(clientId: string, exerciseId: string, limit = 10): Promise<ExerciseActual[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("exercise_actuals")
    .select(`
      *,
      training_sessions (
        client_id,
        coach_id
      )
    `)
    .eq("exercise_id", exerciseId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Filter by client_id and coach_id at application level
  const filtered = (data || []).filter((actual: any) => {
    const session = actual.training_sessions;
    return session && session.client_id === clientId && session.coach_id === user.id;
  });

  // Remove the nested training_sessions object
  return filtered.map(({ training_sessions, ...actual }) => actual as ExerciseActual);
}
