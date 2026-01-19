/**
 * Session Tracking Service
 * 
 * Business logic layer for session management.
 * Framework-agnostic (no React dependencies).
 */

import type { Plan } from '@/types/plan';
import type { SessionTrackingAdapter } from '../adapters/sessionTrackingAdapter';
import type { CreateActualInput } from '../core/types';
import { buildPlanDaySnapshot } from '../core/snapshot';
import { assertValidActualInput, type ActualInput } from '../core/validators';

export interface StartSessionParams {
  plan: Plan;
  planId: string;
  dayId: string;
}

export interface CompleteSetParams {
  sessionId: string;
  input: ActualInput & {
    day_id: string;
    section_id: string;
    group_id?: string;
    exercise_id: string;
    set_index: number;
  };
}

export interface UndoLastSetParams {
  sessionId: string;
  exerciseId: string;
}

export interface FinishSessionParams {
  sessionId: string;
  notes?: string;
}

export interface DiscardSessionParams {
  sessionId: string;
}

/**
 * Factory function to create a session tracking service
 * Injects the adapter for testability and role-specific behavior
 */
export function createSessionTrackingService(adapter: SessionTrackingAdapter) {
  return {
    /**
     * Start a new client session
     * Builds snapshot and creates session in DB
     */
    async startClientSession({ plan, planId, dayId }: StartSessionParams) {
      const coachClientId = await adapter.resolveCoachClientId();
      const snapshot = buildPlanDaySnapshot(plan, dayId);

      return adapter.createSession({
        coach_client_id: coachClientId,
        plan_id: planId,
        day_id: dayId,
        plan_day_snapshot: snapshot,
        source: 'autonomous',
      });
    },

    /**
     * Record a completed set
     * Validates input before creating actual
     */
    async completeSet({ sessionId, input }: CompleteSetParams) {
      // Validate input (throws ValidationError if invalid)
      assertValidActualInput(input);

      const actualInput: CreateActualInput = {
        day_id: input.day_id,
        section_id: input.section_id,
        group_id: input.group_id,
        exercise_id: input.exercise_id,
        set_index: input.set_index,
        reps: input.reps,
        load: input.load,
        rest: input.rest,
      };

      return adapter.createActual(sessionId, actualInput);
    },

    /**
     * Undo the last set for an exercise
     */
    async undoLastSet({ sessionId, exerciseId }: UndoLastSetParams) {
      return adapter.undoLastActual(sessionId, exerciseId);
    },

    /**
     * Complete the session
     */
    async finishSession({ sessionId, notes }: FinishSessionParams) {
      return adapter.updateSession(sessionId, {
        status: 'completed',
        ended_at: new Date().toISOString(),
        notes,
      });
    },

    /**
     * Discard (abandon) the session
     */
    async discardSession({ sessionId }: DiscardSessionParams) {
      return adapter.updateSession(sessionId, {
        status: 'discarded',
        ended_at: new Date().toISOString(),
      });
    },

    /**
     * Get active session if exists
     */
    async getActiveSession() {
      return adapter.getActiveSession();
    },

    /**
     * Get session detail with snapshot
     */
    async getSessionDetail(sessionId: string) {
      return adapter.getSessionDetail(sessionId);
    },

    /**
     * List actuals for a session
     */
    async listActuals(sessionId: string) {
      return adapter.listActuals(sessionId);
    },
  };
}

export type SessionTrackingService = ReturnType<typeof createSessionTrackingService>;
