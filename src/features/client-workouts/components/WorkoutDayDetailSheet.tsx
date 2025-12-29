import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Play, Dumbbell } from "lucide-react";
import { ClientWorkoutExerciseList } from "./ClientWorkoutExerciseList";
import type { Day } from "@/types/plan";
import { countDayExercises } from "../utils/plan-utils";

interface WorkoutDayDetailSheetProps {
  day: Day | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkoutDayDetailSheet({ day, open, onOpenChange }: WorkoutDayDetailSheetProps) {
  if (!day) return null;

  const exerciseCount = countDayExercises(day);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg">{day.title}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {exerciseCount} esercizi
              </p>
            </div>
          </div>
          
          {day.objective && (
            <p className="text-sm text-muted-foreground mt-2">
              {day.objective}
            </p>
          )}
        </SheetHeader>
        
        <div className="overflow-y-auto flex-1 py-4">
          <ClientWorkoutExerciseList day={day} />
        </div>
        
        <div className="sticky bottom-0 pt-4 pb-2 bg-background border-t">
          <Button className="w-full" size="lg" disabled>
            <Play className="h-4 w-4 mr-2" />
            Registra sessione
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Funzionalità in arrivo
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
