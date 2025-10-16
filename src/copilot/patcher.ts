import { PatchOp, ExercisePartial } from "./schema";
import { usePlanStore } from "@/stores/usePlanStore";
import { Exercise } from "@/types/plan";

// Helper to convert ExercisePartial to Partial<Exercise> by handling "auto" order
function toExerciseUpdate(data: ExercisePartial): Partial<Exercise> {
  const { order, ...rest } = data;
  if (order === "auto" || order === undefined) {
    return rest;
  }
  return { ...rest, order };
}

export function applySuggestion(patch: PatchOp[]) {
  const store = usePlanStore.getState();
  
  for (const op of patch) {
    try {
      if (op.op === "add") {
        // Use the store's addExercise method
        store.addExercise(op.target.dayId, op.target.phaseType as any);
        // Then update the newly added exercise with the data
        const plan = usePlanStore.getState().plan;
        if (!plan) continue;
        
        const day = plan.days.find(d => d.id === op.target.dayId);
        if (!day) continue;
        
        const phase = day.phases.find(p => p.type === op.target.phaseType);
        if (!phase || phase.exercises.length === 0) continue;
        
        const newExercise = phase.exercises[phase.exercises.length - 1];
        const updateData = toExerciseUpdate(op.data);
        
        store.updateExercise(op.target.dayId, op.target.phaseType as any, newExercise.id, updateData);
        
      } else if (op.op === "update") {
        // Find the exercise and update it
        const plan = usePlanStore.getState().plan;
        if (!plan) continue;
        
        const updateData = toExerciseUpdate(op.data);
        
        for (const day of plan.days) {
          for (const phase of day.phases) {
            const exercise = phase.exercises.find(e => e.id === op.target.exerciseId);
            if (exercise) {
              store.updateExercise(day.id, phase.type, exercise.id, updateData);
              break;
            }
          }
        }
        
      } else if (op.op === "delete") {
        // Find and delete the exercise
        const plan = usePlanStore.getState().plan;
        if (!plan) continue;
        
        for (const day of plan.days) {
          for (const phase of day.phases) {
            const exercise = phase.exercises.find(e => e.id === op.target.exerciseId);
            if (exercise) {
              store.deleteExercise(day.id, phase.type, exercise.id);
              return;
            }
          }
        }
      }
    } catch {
      // Ignore invalid op
    }
  }
}
