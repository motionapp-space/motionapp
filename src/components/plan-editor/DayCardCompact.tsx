import { Day, PhaseType } from "@/types/plan";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Plus } from "lucide-react";
import { PhaseSectionCompact } from "./PhaseSectionCompact";
import { Exercise } from "@/types/plan";
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

interface DayCardCompactProps {
  day: Day;
  onUpdateTitle: (title: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddExercise: (phaseType: PhaseType) => void;
  onUpdateExercise: (phaseType: PhaseType, exerciseId: string, patch: Partial<Exercise>) => void;
  onDuplicateExercise: (phaseType: PhaseType, exerciseId: string) => void;
  onDeleteExercise: (phaseType: PhaseType, exerciseId: string) => void;
  readonly?: boolean;
}

export const DayCardCompact = ({
  day,
  onUpdateTitle,
  onDuplicate,
  onDelete,
  onAddExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onDeleteExercise,
  readonly = false,
}: DayCardCompactProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Input
            value={day.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="flex-1 text-lg font-semibold h-11"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onDuplicate}
            title="Duplica giorno"
            className="h-11 w-11"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 text-destructive hover:text-destructive"
                title="Elimina giorno"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare questo giorno?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non può essere annullata. Tutti gli esercizi verranno eliminati.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Elimina</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {day.phases.map((phase) => (
          <PhaseSectionCompact
            key={phase.id}
            phase={phase}
            onAddExercise={() => onAddExercise(phase.type)}
            onUpdateExercise={(exerciseId, patch) => onUpdateExercise(phase.type, exerciseId, patch)}
            onDuplicateExercise={(exerciseId) => onDuplicateExercise(phase.type, exerciseId)}
            onDeleteExercise={(exerciseId) => onDeleteExercise(phase.type, exerciseId)}
          />
        ))}
      </CardContent>
    </Card>
  );
};
