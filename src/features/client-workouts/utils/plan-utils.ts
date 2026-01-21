import type { Day, Phase, ExerciseGroup } from "@/types/plan";

/**
 * Count total groups in a day across all phases.
 * A group = 1 unit (single exercise, superset, or circuit)
 */
export function countDayGroups(day: Day): number {
  if (!day.phases) return 0;
  
  return day.phases.reduce((total, phase) => {
    return total + (phase.groups?.length || 0);
  }, 0);
}

/**
 * Count total exercises in a day across all phases and groups
 * @deprecated Use countDayGroups for UI display (counts groups as units)
 */
export function countDayExercises(day: Day): number {
  if (!day.phases) return 0;
  
  return day.phases.reduce((total, phase) => {
    return total + countPhaseExercises(phase);
  }, 0);
}

/**
 * Count exercises in a single phase
 */
export function countPhaseExercises(phase: Phase): number {
  if (!phase.groups) return 0;
  
  return phase.groups.reduce((total, group) => {
    return total + countGroupExercises(group);
  }, 0);
}

/**
 * Count exercises in a single group
 */
export function countGroupExercises(group: ExerciseGroup): number {
  return group.exercises?.length || 0;
}
