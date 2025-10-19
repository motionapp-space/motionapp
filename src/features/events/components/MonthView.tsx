import { useMemo } from "react";
import { format, isSameMonth, isSameDay, parseISO, startOfDay, endOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { getMonthDays, getEventsForDay } from "../utils/calendar-utils";
import { EventCard } from "./EventCard";
import { getClientColor } from "../utils/client-colors";
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

  // Group multi-day events
  const getMultiDayEvents = (day: Date) => {
    return events.filter(event => {
      const eventStart = startOfDay(parseISO(event.start_at));
      const eventEnd = endOfDay(parseISO(event.end_at));
      const currentDay = startOfDay(day);
      return currentDay >= eventStart && currentDay <= eventEnd;
    });
  };

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
          const dayEvents = getMultiDayEvents(day);
          const isCurrentMonth = isSameMonth(day, date);
          const isToday = isSameDay(day, new Date());

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
                {dayEvents.slice(0, 3).map((event) => {
                  const eventStart = startOfDay(parseISO(event.start_at));
                  const isEventStart = isSameDay(eventStart, day);
                  
                  return (
                    <div key={event.id} className="relative">
                      {isEventStart ? (
                        <EventCard
                          event={event}
                          onClick={() => onEventClick(event)}
                          compact
                        />
                      ) : (
                        <div
                          onClick={() => onEventClick(event)}
                          className="h-6 rounded cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ 
                            backgroundColor: getClientColor(event.client_id),
                            opacity: 0.6
                          }}
                        />
                      )}
                    </div>
                  );
                })}
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
