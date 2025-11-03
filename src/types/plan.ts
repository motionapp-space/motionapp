export type Objective = "Strength" | "Hypertrophy" | "Endurance" | "Mobility" | "HIIT" | "Functional";
export type PhaseType = "Warm-up" | "Main Workout" | "Stretching";
export type GroupType = "single" | "superset" | "circuit";
export type ID = string;

export interface Exercise {
  id: ID;
  name: string;
  sets: number;
  reps: string;
  load?: string;
  rest?: string;
  notes?: string;
  goal?: string;
  order: number;
}

export interface ExerciseGroup {
  id: ID;
  type: GroupType;
  name?: string;
  // Superset fields
  sharedSets?: number;
  sharedRestBetweenExercises?: string;
  // Circuit fields
  rounds?: number;
  restBetweenRounds?: string;
  exercises: Exercise[];
  order: number;
}

export interface Phase {
  id: ID;
  type: PhaseType;
  objective?: string; // Block-level objective (max 120 chars)
  groups: ExerciseGroup[];
  // Legacy: for backward compatibility
  exercises?: Exercise[];
}

export interface Day {
  id: ID;
  title: string;
  objective?: string; // Day-level objective (max 120 chars)
  focusMuscle?: string;
  phases: Phase[];
  order: number;
}

export interface Week {
  id: ID;
  index: number;
  days: Day[];
}

export interface PlanMeta {
  id: ID;
  name: string;
  objective: Objective;
  durationWeeks: number;
  createdAt: string;
  updatedAt: string;
}

export interface Plan extends PlanMeta {
  days: Day[];
}

// ---------- Defaults ----------
export const DEFAULT_PHASES: PhaseType[] = ["Warm-up", "Main Workout", "Stretching"];

export function makeExercise(order: number): Exercise {
  return {
    id: crypto.randomUUID(),
    name: "",
    sets: 3,
    reps: "10",
    load: "",
    rest: "01:00",
    notes: "",
    order,
  };
}

export function makeGroup(type: GroupType, order: number): ExerciseGroup {
  const group: ExerciseGroup = {
    id: crypto.randomUUID(),
    type,
    order,
    exercises: [],
  };

  if (type === "superset") {
    group.name = `Superset ${String.fromCharCode(65 + order)}`;
    group.exercises = [makeExercise(1), makeExercise(2)];
  } else if (type === "circuit") {
    group.name = `Circuito ${order + 1}`;
    group.rounds = 3;
    group.restBetweenRounds = "90s";
    group.exercises = [makeExercise(1), makeExercise(2), makeExercise(3)];
  } else {
    group.exercises = [makeExercise(1)];
  }

  return group;
}

export function makePhase(type: PhaseType): Phase {
  return { id: crypto.randomUUID(), type, groups: [] };
}

// Migration helper: convert legacy exercises[] to groups[]
export function migratePhaseToGroups(phase: Phase): Phase {
  if (phase.groups && phase.groups.length > 0) {
    return phase; // Already migrated
  }
  
  if (phase.exercises && phase.exercises.length > 0) {
    // Convert each exercise to a single group
    const groups = phase.exercises.map((exercise, index) => ({
      id: crypto.randomUUID(),
      type: "single" as GroupType,
      exercises: [exercise],
      order: index + 1,
    }));
    return { ...phase, groups, exercises: undefined };
  }
  
  return { ...phase, groups: [], exercises: undefined };
}

export function makeDay(order: number, title?: string): Day {
  return {
    id: crypto.randomUUID(),
    title: title ?? `Giorno ${order}`,
    phases: DEFAULT_PHASES.map(makePhase),
    order,
  };
}

export function makeWeek(index: number): Week {
  return { id: crypto.randomUUID(), index, days: [makeDay(1)] };
}

export function makePlan(name = "Nuovo Piano di Allenamento", objective: Objective = "Strength", durationWeeks = 4): Plan {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    objective,
    durationWeeks,
    createdAt: now,
    updatedAt: now,
    days: [],
  };
}
