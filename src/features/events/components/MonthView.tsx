import { useMemo } from "react";
import { format, isSameMonth } from "date-fns";
import { it } from "date-fns/locale";
import { getMonthDays, getEventsForDay } from "../utils/calendar-utils";
import { EventCard } from "./EventCard";
import { cn } from "@/lib/utils";
import type { EventWithClient } from "../types";

interface MonthViewProps {
  date: Date;
  events: EventWithClient[];
  onEventClick: (event: EventWithClient) => void;
}

export function MonthView({ date, events, onEventClick }: MonthViewProps) {
  const monthDays = useMemo(() => getMonthDays(date), [date]);
  const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="text-center py-3 font-medium text-sm text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-auto">
        {monthDays.map((day) => {
          const dayEvents = getEventsForDay(events, day);
          const isCurrentMonth = isSameMonth(day, date);
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-2 border-r border-b last:border-r-0",
                !isCurrentMonth && "bg-muted/30",
                isToday && "bg-accent/10"
              )}
            >
              <div className={cn(
                "text-sm font-medium mb-2",
                !isCurrentMonth && "text-muted-foreground",
                isToday && "text-primary font-semibold"
              )}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick(event)}
                    compact
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    +{dayEvents.length - 3} altri
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
