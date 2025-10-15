import { Week } from "@/types/plan";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2 } from "lucide-react";
import { DayCard } from "./DayCard";
import { Card } from "@/components/ui/card";

interface WeekCardProps {
  week: Week;
  onAddDay: () => void;
  onDuplicateDay: (dayId: string) => void;
  onDeleteDay: (dayId: string) => void;
  onDuplicateWeek: () => void;
  onDeleteWeek: () => void;
  canDeleteWeek: boolean;
  onUpdateDayTitle: (dayId: string, title: string) => void;
  onAddExercise: (dayId: string, phaseType: any) => void;
  onUpdateExercise: (dayId: string, phaseType: any, exerciseId: string, patch: any) => void;
  onDuplicateExercise: (dayId: string, phaseType: any, exerciseId: string) => void;
  onDeleteExercise: (dayId: string, phaseType: any, exerciseId: string) => void;
}

export const WeekCard = ({
  week,
  onAddDay,
  onDuplicateDay,
  onDeleteDay,
  onDuplicateWeek,
  onDeleteWeek,
  canDeleteWeek,
  onUpdateDayTitle,
  onAddExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onDeleteExercise
}: WeekCardProps) => {
  return (
    <Card className="p-6 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Settimana {week.index}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicateWeek}
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplica Settimana
          </Button>
          {canDeleteWeek && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteWeek}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {week.days.map(day => (
          <DayCard
            key={day.id}
            day={day}
            weekId={week.id}
            onUpdateTitle={(title) => onUpdateDayTitle(day.id, title)}
            onDuplicate={() => onDuplicateDay(day.id)}
            onDelete={() => onDeleteDay(day.id)}
            canDelete={week.days.length > 1}
            onAddExercise={(phaseType) => onAddExercise(day.id, phaseType)}
            onUpdateExercise={(phaseType, exerciseId, patch) => 
              onUpdateExercise(day.id, phaseType, exerciseId, patch)
            }
            onDuplicateExercise={(phaseType, exerciseId) => 
              onDuplicateExercise(day.id, phaseType, exerciseId)
            }
            onDeleteExercise={(phaseType, exerciseId) => 
              onDeleteExercise(day.id, phaseType, exerciseId)
            }
          />
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={onAddDay}
      >
        <Plus className="h-4 w-4 mr-2" />
        Aggiungi Giorno
      </Button>
    </Card>
  );
};
