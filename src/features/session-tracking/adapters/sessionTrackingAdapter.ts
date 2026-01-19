/**
 * Session Tracking Adapter Interface
 * 
 * Contract for role-specific session management implementations.
 * Both coach and client adapters must implement this interface.
 */

import type { PlanDaySnapshot, ClientSessionUpdatableFields, CreateActualInput } from '../core/types';
import type { TrainingSession, ExerciseActual } from '@/features/sessions/types';

// ================== Input Types ==================

export interface CreateClientSessionInput {
  coach_client_id: string;
  plan_id: string;
  day_id: string;
  plan_day_snapshot: PlanDaySnapshot;
  source: 'autonomous';
}

// ================== Adapter Interface ==================

export interface SessionTrackingAdapter {
  /**
   * Resolve coach_client_id for the authenticated user
   */
  resolveCoachClientId(): Promise<string>;

  /**
   * Get currently active session (status = 'in_progress')
   * Returns null if no active session exists
   */
  getActiveSession(): Promise<TrainingSession | null>;

  /**
   * Create a new training session
   */
  createSession(input: CreateClientSessionInput): Promise<TrainingSession>;

  /**
   * Update session with whitelisted fields only
   */
  updateSession(id: string, updates: ClientSessionUpdatableFields): Promise<TrainingSession>;

  /**
   * Get session detail including plan_day_snapshot
   */
  getSessionDetail(id: string): Promise<TrainingSession | null>;

  /**
   * List all actuals for a session
   */
  listActuals(sessionId: string): Promise<ExerciseActual[]>;

  /**
   * Create a new exercise actual
   */
  createActual(sessionId: string, input: CreateActualInput): Promise<ExerciseActual>;

  /**
   * Undo (delete) the last actual for an exercise
   * No-op if no actuals exist for the exercise
   */
  undoLastActual(sessionId: string, exerciseId: string): Promise<void>;

  /**
   * Create multiple actuals in a batch (for superset/circuit)
   */
  createActualsBatch(sessionId: string, inputs: CreateActualInput[]): Promise<ExerciseActual[]>;

  /**
   * Undo last series for a group (superset/circuit)
   * Deletes the last N actuals where N = number of exercises in the group
   */
  undoGroupLastSeries(sessionId: string, exerciseIds: string[], count: number): Promise<void>;
}
