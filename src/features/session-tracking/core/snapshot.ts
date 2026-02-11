/**
 * Builds a minimal, stable snapshot of a plan day for session persistence
 * 
 * The snapshot is stored in training_sessions.plan_day_snapshot and used to
 * render the workout UI even if the original plan is modified or deleted.
 */

import type { Plan, Day, Phase, ExerciseGroup, Exercise } from '@/types/plan';
import type { PlanDaySnapshot, SnapshotPhase, SnapshotGroup, SnapshotExercise } from './types';

/**
 * Build a minimal snapshot from a Plan and dayId
 * @throws Error if day not found in plan
 */
export function buildPlanDaySnapshot(plan: Plan, dayId: string): PlanDaySnapshot {
  const day = plan.days.find(d => d.id === dayId);
  if (!day) {
    throw new Error(`Day ${dayId} not found in plan`);
  }

  return buildDaySnapshot(day);
}

/**
 * Build snapshot directly from a Day object
 */
export function buildDaySnapshot(day: Day): PlanDaySnapshot {
  return {
    day: {
      id: day.id,
      order: day.order,
      title: day.title || `Giorno ${day.order}`,
    },
    phases: (day.phases || []).map(mapPhase),
  };
}

function mapPhase(phase: Phase, index: number): SnapshotPhase {
  return {
    type: phase.type,
    order: index,
    groups: (phase.groups || []).map(mapGroup),
  };
}

function mapGroup(group: ExerciseGroup): SnapshotGroup {
  const result: SnapshotGroup = {
    id: group.id,
    type: group.type,
    label: group.name,
    exercises: (group.exercises || []).map(mapExercise),
  };
  if (group.type === 'superset') {
    result.group_rest_seconds = parseRestToSeconds(group.sharedRestBetweenExercises);
    result.target_sets = group.sharedSets;
  } else if (group.type === 'circuit') {
    result.group_rest_seconds = parseRestToSeconds(group.restBetweenRounds);
    result.target_sets = group.rounds;
  }
  return result;
}

function mapExercise(exercise: Exercise): SnapshotExercise {
  return {
    id: exercise.id,
    name: exercise.name || '',
    sets: exercise.sets || 0,
    reps: exercise.reps || '',
    rest_seconds: parseRestToSeconds(exercise.rest),
    load: exercise.load || undefined,
    notes: exercise.notes || undefined,
    goal: exercise.goal || undefined,
  };
}

/**
 * Parse rest string (e.g., "01:30", "90s", "90") to seconds
 */
function parseRestToSeconds(rest?: string): number | undefined {
  if (!rest) return undefined;
  
  // Handle "MM:SS" format
  if (rest.includes(':')) {
    const parts = rest.split(':');
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseInt(parts[1], 10) || 0;
    return minutes * 60 + seconds;
  }
  
  // Handle "90s" or "90" format
  const numericPart = parseInt(rest.replace(/[^\d]/g, ''), 10);
  return isNaN(numericPart) ? undefined : numericPart;
}
