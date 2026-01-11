import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeekDay } from "../hooks/useWeeklyProgress";

interface WeeklyDayTimelineProps {
  weekDays: WeekDay[];
  isLoading?: boolean;
}

// Single-letter Italian day abbreviations
const DAY_LETTERS = ["L", "M", "M", "G", "V", "S", "D"];

export function WeeklyDayTimeline({ weekDays, isLoading }: WeeklyDayTimelineProps) {
  // Determine today's index (0 = Monday, 6 = Sunday)
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  if (isLoading) {
    return (
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Questa settimana
        </p>
        <div className="flex justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-3 w-4" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Questa settimana
      </p>
      <div className="flex justify-between">
        {weekDays.map((day, index) => {
          const isToday = index === todayIndex;
          const isPast = index < todayIndex;
          const isFuture = index > todayIndex;
          
          // Determine dot state
          const isCompleted = day.isCompleted;
          const isMissed = isPast && !isCompleted && day.isPlanned;
          const isUpcoming = (isFuture || isToday) && day.isPlanned && !isCompleted;
          
          return (
            <div key={day.key} className="flex flex-col items-center gap-1">
              {/* Day letter */}
              <span className={cn(
                "text-[10px] font-medium",
                isToday ? "text-primary font-semibold" : "text-muted-foreground"
              )}>
                {DAY_LETTERS[index]}
              </span>
              
              {/* Status dot */}
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  // Completed: solid primary with check
                  isCompleted && "bg-primary text-primary-foreground",
                  // Missed (past + planned but not done): dashed/muted ring
                  isMissed && "border-2 border-dashed border-muted-foreground/40 bg-background",
                  // Upcoming (planned, not done yet): outlined primary with reduced opacity
                  isUpcoming && !isToday && "border border-primary/40 bg-background",
                  // Today upcoming: thicker border
                  isUpcoming && isToday && "border-2 border-primary bg-background",
                  // Rest day or unplanned past: just muted
                  !isCompleted && !isMissed && !isUpcoming && isPast && "bg-muted/50",
                  // Unplanned future: very subtle
                  !isCompleted && !isMissed && !isUpcoming && isFuture && "bg-muted/30",
                  // Today highlight if not completed and not upcoming
                  isToday && !isCompleted && !isUpcoming && "border-2 border-primary/60 bg-background"
                )}
              >
                {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
              </div>
              
              {/* "Oggi" micro-label for today */}
              {isToday && (
                <span className="text-[9px] text-muted-foreground leading-none">
                  Oggi
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
