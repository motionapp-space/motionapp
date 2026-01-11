import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeekDay } from "../hooks/useWeeklyProgress";

interface WeeklyDayTimelineProps {
  weekDays: WeekDay[];
  isLoading?: boolean;
}

export function WeeklyDayTimeline({ weekDays, isLoading }: WeeklyDayTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex justify-between px-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-between px-2">
      {weekDays.map((day) => (
        <div key={day.key} className="flex flex-col items-center gap-1">
          {/* Day label */}
          <span className="text-[10px] font-medium text-muted-foreground">
            {day.label}
          </span>
          
          {/* Compact indicator */}
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
              day.isCompleted && "bg-primary text-primary-foreground",
              day.isPlanned && !day.isCompleted && "border-2 border-primary bg-background",
              !day.isPlanned && "bg-muted"
            )}
          >
            {day.isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
          </div>
        </div>
      ))}
    </div>
  );
}
