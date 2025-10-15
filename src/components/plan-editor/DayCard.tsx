import { Day, PhaseType } from "@/types/plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Trash2 } from "lucide-react";
import { PhaseSection } from "./PhaseSection";
import { Card } from "@/components/ui/card";

interface DayCardProps {
  day: Day;
  weekId: string;
  onUpdateTitle: (title: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
  onAddExercise: (phaseType: PhaseType) => void;
  onUpdateExercise: (phaseType: PhaseType, exerciseId: string, patch: any) => void;
  onDuplicateExercise: (phaseType: PhaseType, exerciseId: string) => void;
  onDeleteExercise: (phaseType: PhaseType, exerciseId: string) => void;
}

export const DayCard = ({
  day,
  weekId,
  onUpdateTitle,
  onDuplicate,
  onDelete,
  canDelete,
  onAddExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onDeleteExercise
}: DayCardProps) => {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Input
          value={day.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="flex-1 font-semibold"
          placeholder="Titolo del giorno"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onDuplicate}
        >
          <Copy className="h-4 w-4" />
        </Button>
        {canDelete && (
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {day.phases.map(phase => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            weekId={weekId}
            dayId={day.id}
            onAddExercise={onAddExercise}
            onUpdateExercise={(exerciseId, patch) => onUpdateExercise(phase.type, exerciseId, patch)}
            onDuplicateExercise={(exerciseId) => onDuplicateExercise(phase.type, exerciseId)}
            onDeleteExercise={(exerciseId) => onDeleteExercise(phase.type, exerciseId)}
          />
        ))}
      </div>
    </Card>
  );
};
