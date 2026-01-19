/**
 * Core types for Session Tracking module
 * Shared between coach and client adapters
 */

export type SessionRole = 'coach' | 'client';

// ================== Plan Day Snapshot Types ==================
// Minimal, stable snapshot for session persistence

export interface PlanDaySnapshot {
  day: {
    id: string;
    order: number;
    title: string;
  };
  phases: SnapshotPhase[];
}

export interface SnapshotPhase {
  type: string;
  order: number;
  groups: SnapshotGroup[];
}

export interface SnapshotGroup {
  id: string;
  type: 'single' | 'superset' | 'circuit';
  label?: string;
  exercises: SnapshotExercise[];
}

export interface SnapshotExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
}

// ================== Session Update Types ==================
// Whitelisted fields for client session updates (security)

export interface ClientSessionUpdatableFields {
  status?: 'in_progress' | 'completed' | 'discarded';
  ended_at?: string;
  notes?: string;
}

// ================== Actual Input Types ==================

export interface CreateActualInput {
  day_id: string;
  section_id: string;
  group_id?: string;
  exercise_id: string;
  set_index: number;
  reps: string;
  load?: string;
  rest?: string;
  rpe?: number;
  note?: string;
}
