import type { Day, Phase, ExerciseGroup, Exercise } from "@/types/plan";

interface ClientWorkoutExerciseListProps {
  day: Day;
}

const PHASE_LABELS: Record<string, string> = {
  WARM_UP: "Riscaldamento",
  MAIN_WORKOUT: "Allenamento principale",
  STRETCHING: "Stretching",
};

function ExerciseItem({ exercise }: { exercise: Exercise }) {
  const setsReps = exercise.sets && exercise.reps 
    ? `${exercise.sets} × ${exercise.reps}` 
    : exercise.sets 
      ? `${exercise.sets} serie`
      : null;

  return (
    <div className="py-2 border-b border-border/50 last:border-0">
      <p className="font-medium text-[15px] leading-6 text-foreground">
        {exercise.name || "Esercizio senza nome"}
      </p>
      <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
        {setsReps && <span>{setsReps}</span>}
        {exercise.load && <span>• {exercise.load}</span>}
        {exercise.rest && <span>• Rec: {exercise.rest}</span>}
      </div>
      {exercise.notes && (
        <p className="text-xs text-muted-foreground mt-1 italic">
          {exercise.notes}
        </p>
      )}
    </div>
  );
}

function GroupSection({ group }: { group: ExerciseGroup }) {
  const isSuperset = group.type === "superset";
  const isCircuit = group.type === "circuit";
  
  return (
    <div className={isSuperset || isCircuit ? "pl-3 border-l-2 border-primary/30" : ""}>
      {(isSuperset || isCircuit) && (
        <p className="text-xs font-medium text-primary mb-1">
          {isSuperset ? "Superset" : "Circuito"}
        </p>
      )}
      {group.exercises?.map((exercise) => (
        <ExerciseItem key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}

function PhaseSection({ phase }: { phase: Phase }) {
  const label = PHASE_LABELS[phase.type] || phase.type;
  const hasExercises = phase.groups?.some(g => g.exercises?.length > 0);
  
  if (!hasExercises) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h4>
      <div className="space-y-1">
        {phase.groups?.map((group) => (
          <GroupSection key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}

export function ClientWorkoutExerciseList({ day }: ClientWorkoutExerciseListProps) {
  const phases = day.phases || [];
  
  if (phases.length === 0) {
    return (
      <p className="text-[15px] leading-6 text-muted-foreground py-2">
        Nessun esercizio in questo giorno
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {phases.map((phase) => (
        <PhaseSection key={phase.id} phase={phase} />
      ))}
    </div>
  );
}
