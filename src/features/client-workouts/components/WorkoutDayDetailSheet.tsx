import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Play, Dumbbell } from "lucide-react";
import { ClientWorkoutExerciseList } from "./ClientWorkoutExerciseList";
import type { Day } from "@/types/plan";
import { countDayExercises } from "../utils/plan-utils";
import { toast } from "sonner";

interface WorkoutDayDetailSheetProps {
  day: Day | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSession?: () => void | Promise<void>;
}

export function WorkoutDayDetailSheet({ day, open, onOpenChange, onStartSession }: WorkoutDayDetailSheetProps) {
  if (!day) return null;

  const exerciseCount = countDayExercises(day);

  const handleStart = async () => {
    try {
      await onStartSession?.();
    } catch (error) {
      console.error("Failed to start session from detail:", error);
      toast.error("Impossibile avviare la sessione. Riprova.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl flex flex-col px-5 py-6">
        <SheetHeader className="text-left pb-4 border-b shrink-0 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-[22px] font-semibold tracking-tight leading-snug">{day.title}</SheetTitle>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {exerciseCount} esercizi
              </p>
            </div>
          </div>
          
          {day.objective && (
            <p className="text-[15px] leading-6 text-muted-foreground mt-2">
              {day.objective}
            </p>
          )}
        </SheetHeader>
        
        <div className="overflow-y-auto flex-1 min-h-0 py-4">
          <ClientWorkoutExerciseList day={day} />
        </div>
        
        <div className="shrink-0 pt-4 pb-2 bg-background border-t">
          <Button className="w-full" size="lg" onClick={handleStart}>
            <Play className="h-4 w-4 mr-2" />
            Registra sessione
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
