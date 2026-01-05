/**
 * Counts total exercises from a day_structure snapshot.
 * Handles phases → groups → exercises structure.
 */
export function countExercisesFromDayStructure(dayStructure: any): number {
  const phases = dayStructure?.phases;
  if (!Array.isArray(phases)) return 0;

  let total = 0;
  for (const phase of phases) {
    const groups = phase?.groups;
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      const exercises = group?.exercises;
      if (Array.isArray(exercises)) total += exercises.length;
    }
  }
  return total;
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
