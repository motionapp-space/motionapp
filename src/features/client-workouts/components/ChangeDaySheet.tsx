import { Check, Dumbbell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface PlanDayOption {
  id: string;
  title: string;
  exercisesCount: number;
  isCompletedThisWeek: boolean;
  estimatedMinutes?: number;
}

interface ChangeDaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  days: PlanDayOption[];
  currentDayId?: string;
  onSelectDay: (dayId: string) => void;
}

export function ChangeDaySheet({
  open,
  onOpenChange,
  days,
  currentDayId,
  onSelectDay,
}: ChangeDaySheetProps) {
  const handleSelect = (day: PlanDayOption) => {
    if (day.isCompletedThisWeek) return;
    onSelectDay(day.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Scegli un giorno</SheetTitle>
        </SheetHeader>

        <div className="space-y-2 overflow-y-auto">
          {days.map((day) => {
            const isSelected = day.id === currentDayId;
            const isDisabled = day.isCompletedThisWeek;

            return (
              <button
                key={day.id}
                onClick={() => handleSelect(day)}
                disabled={isDisabled}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                  isSelected && !isDisabled && "bg-primary/10 border border-primary",
                  !isSelected && !isDisabled && "bg-card hover:bg-muted border border-border",
                  isDisabled && "opacity-50 cursor-not-allowed bg-muted"
                )}
              >
                {/* Icon/Status */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                    day.isCompletedThisWeek 
                      ? "bg-green-500 text-white" 
                      : "bg-primary/10"
                  )}
                >
                  {day.isCompletedThisWeek ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <Dumbbell className="w-4 h-4 text-primary" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    isDisabled && "text-muted-foreground"
                  )}>
                    {day.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {day.exercisesCount} esercizi
                    {day.estimatedMinutes && ` · ~${day.estimatedMinutes} min`}
                  </p>
                </div>

                {/* Completed badge */}
                {day.isCompletedThisWeek && (
                  <span className="text-xs text-green-600 font-medium">
                    Completato
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
