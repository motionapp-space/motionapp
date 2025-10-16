import { Phase, Exercise } from "@/types/plan";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ExerciseRowCompact } from "./ExerciseRowCompact";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface PhaseSectionCompactProps {
  phase: Phase;
  onAddExercise: () => void;
  onUpdateExercise: (exerciseId: string, patch: Partial<Exercise>) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
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
}: PhaseSectionCompactProps) => {
  const [deleteExerciseId, setDeleteExerciseId] = useState<string | null>(null);
  
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
        <Button
          variant="outline"
          size="sm"
          onClick={onAddExercise}
          className="gap-2 h-11"
        >
          <Plus className="h-4 w-4" />
          Aggiungi esercizio
        </Button>
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
            <div className="col-span-1"></div>
          </div>
          
          {/* Exercise Rows */}
          {phase.exercises
            .sort((a, b) => a.order - b.order)
            .map((exercise) => (
              <AlertDialog key={exercise.id}>
                <ExerciseRowCompact
                  exercise={exercise}
                  onUpdate={(patch) => onUpdateExercise(exercise.id, patch)}
                  onDuplicate={() => onDuplicateExercise(exercise.id)}
                  onDelete={() => setDeleteExerciseId(exercise.id)}
                />
                {deleteExerciseId === exercise.id && (
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminare questo esercizio?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Questa azione non può essere annullata.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteExerciseId(null)}>
                        Annulla
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          onDeleteExercise(exercise.id);
                          setDeleteExerciseId(null);
                        }}
                      >
                        Elimina
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                )}
              </AlertDialog>
            ))}
        </div>
      )}
    </div>
  );
};
