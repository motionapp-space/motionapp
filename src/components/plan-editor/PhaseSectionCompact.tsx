import { Phase, Exercise } from "@/types/plan";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ExerciseRowCompact } from "./ExerciseRowCompact";

interface PhaseSectionCompactProps {
  phase: Phase;
  onAddExercise: () => void;
  onUpdateExercise: (exerciseId: string, patch: Partial<Exercise>) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  readonly?: boolean;
}

const phaseLabels: Record<string, string> = {
  "Warm-up": "Riscaldamento",
  "Main Workout": "Corpo principale",
  "Stretching": "Stretching",
};

export const PhaseSectionCompact = ({
  phase,
  onAddExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onDeleteExercise,
  readonly = false,
}: PhaseSectionCompactProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {phaseLabels[phase.type] || phase.type}
          </h3>
          <p className="text-sm text-muted-foreground">
            {phase.exercises.length} {phase.exercises.length === 1 ? 'esercizio' : 'esercizi'}
          </p>
        </div>
        {!readonly && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddExercise}
            className="gap-2 h-11"
          >
            <Plus className="h-4 w-4" />
            Aggiungi esercizio
          </Button>
        )}
      </div>

      {phase.exercises.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          Nessun esercizio ancora
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-3 px-3 pb-2 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-3">Nome</div>
            <div className="col-span-1 text-center">Serie</div>
            <div className="col-span-1 text-center">Rip</div>
            <div className="col-span-1 text-center">Carico</div>
            <div className="col-span-1 text-center">Rec</div>
            <div className="col-span-2">Obiettivo</div>
            <div className="col-span-2">Note</div>
            {!readonly && <div className="col-span-1"></div>}
          </div>
          
          {/* Exercise Rows */}
          {phase.exercises
            .sort((a, b) => a.order - b.order)
            .map((exercise) => (
              <ExerciseRowCompact
                key={exercise.id}
                exercise={exercise}
                onUpdate={(patch) => onUpdateExercise(exercise.id, patch)}
                onDuplicate={() => onDuplicateExercise(exercise.id)}
                onDelete={() => onDeleteExercise(exercise.id)}
                readonly={readonly}
              />
            ))}
        </div>
      )}
    </div>
  );
};
