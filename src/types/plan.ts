export type Objective = "Strength" | "Hypertrophy" | "Endurance" | "Mobility" | "HIIT" | "Functional";
export type PhaseType = "Warm-up" | "Main Workout" | "Stretching";
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

export interface Phase {
  id: ID;
  type: PhaseType;
  exercises: Exercise[];
}

export interface Day {
  id: ID;
  title: string;
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
  weeks: Week[];
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

export function makePhase(type: PhaseType): Phase {
  return { id: crypto.randomUUID(), type, exercises: [] };
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
    weeks: Array.from({ length: durationWeeks }, (_, i) => makeWeek(i + 1)),
  };
}
