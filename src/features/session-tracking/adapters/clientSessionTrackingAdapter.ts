/**
 * Client Session Tracking Adapter
 * 
 * Implements SessionTrackingAdapter for client-side session management.
 * Uses RLS policies to ensure clients can only access their own data.
 */

import { supabase } from '@/integrations/supabase/client';
import { getClientCoachClientId } from '@/lib/coach-client';
import type { SessionTrackingAdapter, CreateClientSessionInput } from './sessionTrackingAdapter';
import type { ClientSessionUpdatableFields, CreateActualInput, PlanDaySnapshot } from '../core/types';
import type { TrainingSession, ExerciseActual } from '@/features/sessions/types';

/**
 * Wrapper to normalize getClientCoachClientId return type
 */
async function resolveClientCoachClientId(): Promise<string> {
  const result = await getClientCoachClientId();
  return result.coachClientId;
}

export const clientSessionTrackingAdapter: SessionTrackingAdapter = {
  async resolveCoachClientId(): Promise<string> {
    return resolveClientCoachClientId();
  },

  async getActiveSession(): Promise<TrainingSession | null> {
    const coachClientId = await resolveClientCoachClientId();

    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('coach_client_id', coachClientId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as TrainingSession | null;
  },

  async createSession(input: CreateClientSessionInput): Promise<TrainingSession> {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert([{
        coach_client_id: input.coach_client_id,
        plan_id: input.plan_id,
        day_id: input.day_id,
        plan_day_snapshot: JSON.parse(JSON.stringify(input.plan_day_snapshot)),
        source: 'autonomous',
        status: 'in_progress',
        started_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data as TrainingSession;
  },

  /**
   * Update session with ONLY whitelisted fields
   * This is a security measure to prevent clients from modifying sensitive fields
   */
  async updateSession(id: string, updates: ClientSessionUpdatableFields): Promise<TrainingSession> {
    // Explicit whitelist - never pass raw updates
    const safeUpdates: Record<string, unknown> = {};
    if (updates.status !== undefined) safeUpdates.status = updates.status;
    if (updates.ended_at !== undefined) safeUpdates.ended_at = updates.ended_at;
    if (updates.notes !== undefined) safeUpdates.notes = updates.notes;

    const { data, error } = await supabase
      .from('training_sessions')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TrainingSession;
  },

  /**
   * Get session detail including plan_day_snapshot
   */
  async getSessionDetail(id: string): Promise<TrainingSession | null> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*, plan_day_snapshot') // Explicit inclusion
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as TrainingSession | null;
  },

  async listActuals(sessionId: string): Promise<ExerciseActual[]> {
    const { data, error } = await supabase
      .from('exercise_actuals')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as ExerciseActual[];
  },

  async createActual(sessionId: string, input: CreateActualInput): Promise<ExerciseActual> {
    const { data, error } = await supabase
      .from('exercise_actuals')
      .insert({
        session_id: sessionId,
        day_id: input.day_id,
        section_id: input.section_id,
        group_id: input.group_id,
        exercise_id: input.exercise_id,
        set_index: input.set_index,
        reps: input.reps,
        load: input.load,
        rest: input.rest,
        rpe: input.rpe,
        note: input.note,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ExerciseActual;
  },

  /**
   * Undo last actual for an exercise
   * No-op if no actuals exist (doesn't throw)
   */
  async undoLastActual(sessionId: string, exerciseId: string): Promise<void> {
    // 1. Find the last actual for this exercise in this session
    const { data: lastActual, error: findError } = await supabase
      .from('exercise_actuals')
      .select('id')
      .eq('session_id', sessionId)
      .eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;

    // No-op if no actual found
    if (!lastActual) return;

    // 2. Delete it
    const { error: deleteError } = await supabase
      .from('exercise_actuals')
      .delete()
      .eq('id', lastActual.id);

    if (deleteError) throw deleteError;
  },
};
