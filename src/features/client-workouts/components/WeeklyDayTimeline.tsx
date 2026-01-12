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
      <div className="flex justify-between">
        {weekDays.map((day, index) => {
          const isToday = index === todayIndex;
          const isPast = index < todayIndex;
          const isFuture = index > todayIndex;
          
          // Determine dot state
          const isCompleted = day.isCompleted;
          const isMissed = isPast && !isCompleted;
          
          return (
            <div key={day.key} className="flex flex-col items-center gap-0.5">
              {/* Day letter - tighter to dot */}
              <span className={cn(
                "text-[10px] font-medium leading-none",
                isToday ? "text-primary font-semibold" : "text-muted-foreground"
              )}>
                {DAY_LETTERS[index]}
              </span>
              
              {/* Status dot - 3 clear visual states */}
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  // Completed: solid blue + check
                  isCompleted && "bg-primary text-primary-foreground",
                  // Past not completed: empty circle + gray border
                  isMissed && "border border-muted-foreground/40 bg-background",
                  // Future: empty circle + 40-50% opacity
                  isFuture && !isCompleted && "border border-muted-foreground/30 bg-muted/20",
                  // Today (not completed): thicker primary border
                  isToday && !isCompleted && "border-2 border-primary bg-background"
                )}
              >
                {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
              </div>
              
              {/* "Oggi" micro-label - tighter spacing */}
              {isToday ? (
                <span className="text-[9px] text-muted-foreground leading-none">
                  Oggi
                </span>
              ) : (
                <span className="h-[11px]" /> // Spacer for alignment
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
