import { Day, PhaseType, Exercise, ExerciseGroup, GroupType } from "@/types/plan";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";
import { PhaseSectionCompact } from "./PhaseSectionCompact";
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
  onAddGroup: (phaseType: PhaseType, groupType: GroupType) => void;
  onUpdateGroup: (phaseType: PhaseType, groupId: string, updates: Partial<ExerciseGroup>) => void;
  onDuplicateGroup: (phaseType: PhaseType, groupId: string) => void;
  onDeleteGroup: (phaseType: PhaseType, groupId: string) => void;
  onAddExerciseToGroup: (phaseType: PhaseType, groupId: string) => void;
  onUpdateExercise: (phaseType: PhaseType, groupId: string, exerciseId: string, patch: Partial<Exercise>) => void;
  onDuplicateExercise: (phaseType: PhaseType, groupId: string, exerciseId: string) => void;
  onDeleteExercise: (phaseType: PhaseType, groupId: string, exerciseId: string) => void;
  readonly?: boolean;
}

export const DayCardCompact = ({
  day,
  onUpdateTitle,
  onDuplicate,
  onDelete,
  onAddGroup,
  onUpdateGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onAddExerciseToGroup,
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
            disabled={readonly}
            readOnly={readonly}
          />
          {!readonly && (
            <>
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
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {day.phases.map((phase) => (
          <PhaseSectionCompact
            key={phase.id}
            phase={phase}
            onAddGroup={(groupType) => onAddGroup(phase.type, groupType)}
            onUpdateGroup={(groupId, updates) => onUpdateGroup(phase.type, groupId, updates)}
            onDuplicateGroup={(groupId) => onDuplicateGroup(phase.type, groupId)}
            onDeleteGroup={(groupId) => onDeleteGroup(phase.type, groupId)}
            onAddExerciseToGroup={(groupId) => onAddExerciseToGroup(phase.type, groupId)}
            onUpdateExercise={(groupId, exerciseId, patch) => onUpdateExercise(phase.type, groupId, exerciseId, patch)}
            onDuplicateExercise={(groupId, exerciseId) => onDuplicateExercise(phase.type, groupId, exerciseId)}
            onDeleteExercise={(groupId, exerciseId) => onDeleteExercise(phase.type, groupId, exerciseId)}
            readonly={readonly}
          />
        ))}
      </CardContent>
    </Card>
  );
};
