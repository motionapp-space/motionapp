import type { Plan } from "@/types/plan";

export function buildPlanContext(plan: Plan | null) {
  if (!plan) return { plan: null, locale: "it-IT" };

  const days = (plan.days ?? []).slice(0, 2).map(d => ({
    id: d.id,
    title: d.title,
    order: d.order,
    phases: d.phases.map(p => ({
      id: p.id,
      type: p.type,
      exercises: p.exercises.slice(0, 8).map(e => ({
        id: e.id,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        load: e.load,
        rest: e.rest,
        notes: e.notes,
        goal: e.goal,
        order: e.order
      }))
    }))
  }));

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      objective: plan.objective,
      durationWeeks: plan.durationWeeks,
      days
    },
    locale: "it-IT"
  };
}
