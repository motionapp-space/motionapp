import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeekDay } from "../hooks/useWeeklyProgress";

interface WeeklyDayTimelineProps {
  weekDays: WeekDay[];
  isLoading?: boolean;
}

// Unambiguous Italian day abbreviations
const DAY_LABELS: Record<string, string> = {
  lun: "Lun",
  mar: "Mar", 
  mer: "Mer",
  gio: "Gio",
  ven: "Ven",
  sab: "Sab",
  dom: "Dom",
};

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
              <Skeleton className="h-3 w-6" />
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
          const displayLabel = DAY_LABELS[day.label.toLowerCase()] || day.label;
          
          // Determine dot state
          const isCompleted = day.isCompleted;
          const isMissed = isPast && !isCompleted && day.isPlanned;
          const isUpcoming = (isFuture || isToday) && day.isPlanned && !isCompleted;
          
          return (
            <div key={day.key} className="flex flex-col items-center gap-1">
              {/* Day label - show "Oggi" for today */}
              <span className={cn(
                "text-[10px] font-medium",
                isToday ? "text-primary font-semibold" : "text-muted-foreground"
              )}>
                {isToday ? "Oggi" : displayLabel}
              </span>
              
              {/* Status dot */}
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  // Completed: solid primary with check
                  isCompleted && "bg-primary text-primary-foreground",
                  // Missed (past + planned but not done): muted with subtle indicator
                  isMissed && "bg-muted/60 border border-muted-foreground/20",
                  // Upcoming (planned, not done yet): outlined primary
                  isUpcoming && "border-2 border-primary bg-background",
                  // Rest day or unplanned: just muted
                  !isCompleted && !isMissed && !isUpcoming && "bg-muted",
                  // Today highlight ring if not completed
                  isToday && !isCompleted && "ring-2 ring-primary ring-offset-1"
                )}
              >
                {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
