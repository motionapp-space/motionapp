import { useState, useEffect } from "react";
import { Dumbbell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PlanDayOption {
  id: string;
  title: string;
  exercisesCount: number;
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
  const [selectedDayId, setSelectedDayId] = useState<string | undefined>(undefined);

  // Reset selection when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedDayId(undefined);
    }
  }, [open]);

  const handleDayClick = (day: PlanDayOption) => {
    setSelectedDayId(day.id);
  };

  const handleStartSession = () => {
    if (selectedDayId) {
      onSelectDay(selectedDayId);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle>Scegli un giorno</SheetTitle>
        </SheetHeader>

        <div className="space-y-2 overflow-y-auto flex-1">
          {days.map((day) => {
            const isSelected = day.id === selectedDayId;

            return (
              <button
                key={day.id}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                  isSelected && "bg-primary/10 border border-primary",
                  !isSelected && "bg-card hover:bg-muted border border-border"
                )}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                  <Dumbbell className="w-4 h-4 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {day.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {day.exercisesCount} esercizi
                    {day.estimatedMinutes && ` · ~${day.estimatedMinutes} min`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <SheetFooter className="pt-4 border-t mt-4">
          <Button 
            className="w-full h-11 rounded-2xl text-sm"
            disabled={!selectedDayId}
            onClick={handleStartSession}
          >
            Avvia sessione
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
