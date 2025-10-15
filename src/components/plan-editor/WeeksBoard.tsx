import { usePlanStore } from "@/stores/usePlanStore";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WeekCard } from "./WeekCard";

export const WeeksBoard = () => {
  const { plan, addWeek, duplicateWeek, deleteWeek, addDay, updateDayTitle, duplicateDay, deleteDay, addExercise, updateExercise, duplicateExercise, deleteExercise } = usePlanStore();

  if (!plan) return null;

  return (
    <div className="space-y-6">
      {plan.weeks.map(week => (
        <WeekCard
          key={week.id}
          week={week}
          onAddDay={() => addDay(week.id)}
          onDuplicateDay={(dayId) => duplicateDay(week.id, dayId)}
          onDeleteDay={(dayId) => deleteDay(week.id, dayId)}
          onDuplicateWeek={() => duplicateWeek(week.id)}
          onDeleteWeek={() => deleteWeek(week.id)}
          canDeleteWeek={plan.weeks.length > 1}
          onUpdateDayTitle={(dayId, title) => updateDayTitle(week.id, dayId, title)}
          onAddExercise={(dayId, phaseType) => addExercise(week.id, dayId, phaseType)}
          onUpdateExercise={(dayId, phaseType, exerciseId, patch) => 
            updateExercise(week.id, dayId, phaseType, exerciseId, patch)
          }
          onDuplicateExercise={(dayId, phaseType, exerciseId) => 
            duplicateExercise(week.id, dayId, phaseType, exerciseId)
          }
          onDeleteExercise={(dayId, phaseType, exerciseId) => 
            deleteExercise(week.id, dayId, phaseType, exerciseId)
          }
        />
      ))}

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={addWeek}
      >
        <Plus className="h-5 w-5 mr-2" />
        Aggiungi Settimana
      </Button>
    </div>
  );
};
