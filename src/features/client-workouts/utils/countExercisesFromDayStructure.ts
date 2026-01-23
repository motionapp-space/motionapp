/**
 * Counts total groups from a day_structure snapshot.
 * A group = 1 unit (single exercise, superset, or circuit)
 */
export function countGroupsFromDayStructure(dayStructure: any): number {
  const phases = dayStructure?.phases;
  if (!Array.isArray(phases)) return 0;

  let total = 0;
  for (const phase of phases) {
    const groups = phase?.groups;
    if (Array.isArray(groups)) total += groups.length;
  }
  return total;
}

/**
 * Counts total groups from a phases array (new snapshot format).
 * A group = 1 unit (single exercise, superset, or circuit)
 */
export function countGroupsFromPhases(phases: any[]): number {
  if (!Array.isArray(phases)) return 0;

  let total = 0;
  for (const phase of phases) {
    const groups = phase?.groups;
    if (Array.isArray(groups)) total += groups.length;
  }
  return total;
}

/**
 * Finds exercise name from new snapshot format (with phases at root level)
 */
export function findExerciseNameFromPhases(phases: any[], exerciseId: string): string | null {
  if (!Array.isArray(phases)) return null;
  for (const phase of phases) {
    for (const group of phase?.groups || []) {
      const found = group?.exercises?.find((e: any) => e.id === exerciseId);
      if (found?.name) return found.name;
    }
  }
  return null;
}

/**
 * Finds an exercise name from a day_structure snapshot by exerciseId.
 * Returns null if not found.
 */
export function findExerciseNameFromDayStructure(dayStructure: any, exerciseId: string): string | null {
  if (!dayStructure?.phases) return null;
  for (const phase of dayStructure.phases) {
    for (const group of phase?.groups || []) {
      const found = group?.exercises?.find((e: any) => e.id === exerciseId);
      if (found?.name) return found.name;
    }
  }
  return null;
}

// Legacy exports for backwards compatibility
export const countExercisesFromDayStructure = countGroupsFromDayStructure;
