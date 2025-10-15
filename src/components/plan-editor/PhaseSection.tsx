import { Phase, PhaseType } from "@/types/plan";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ExerciseRow } from "./ExerciseRow";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface PhaseSectionProps {
  phase: Phase;
  weekId: string;
  dayId: string;
  onAddExercise: (phaseType: PhaseType) => void;
  onUpdateExercise: (exerciseId: string, patch: any) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
}

const phaseLabels: Record<PhaseType, string> = {
  "Warm-up": "Riscaldamento",
  "Main Workout": "Allenamento Principale",
  "Stretching": "Stretching"
};

export const PhaseSection = ({
  phase,
  weekId,
  dayId,
  onAddExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onDeleteExercise
}: PhaseSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-xl bg-card overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <h4 className="font-semibold text-sm">{phaseLabels[phase.type]}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {phase.exercises.length} {phase.exercises.length === 1 ? 'esercizio' : 'esercizi'}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 space-y-2">
            {phase.exercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nessun esercizio. Clicca "+ Aggiungi Esercizio" per iniziare.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-xs font-medium text-muted-foreground">
                  <div className="col-span-4">Esercizio</div>
                  <div className="col-span-1">Serie</div>
                  <div className="col-span-1">Rip</div>
                  <div className="col-span-2">Carico</div>
                  <div className="col-span-1">Rec</div>
                  <div className="col-span-2">Note</div>
                  <div className="col-span-1"></div>
                </div>
                {phase.exercises.map(exercise => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    onUpdate={(patch) => onUpdateExercise(exercise.id, patch)}
                    onDuplicate={() => onDuplicateExercise(exercise.id)}
                    onDelete={() => onDeleteExercise(exercise.id)}
                  />
                ))}
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => onAddExercise(phase.type)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Esercizio
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
