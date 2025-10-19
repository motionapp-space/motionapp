import { useMemo, useEffect, useRef } from "react";
import { format, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { getWeekDays, getEventsForTimeSlot, getEventsForDay } from "../utils/calendar-utils";
import { EventCard } from "./EventCard";
import type { EventWithClient } from "../types";

interface WeekViewProps {
  date: Date;
  events: EventWithClient[];
  onEventClick: (event: EventWithClient) => void;
}

export function WeekView({ date, events, onEventClick }: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(date), [date]);
  const hours = useMemo(() => Array.from({ length: 18 }, (_, i) => i + 5), []); // 05:00 to 23:00
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();
  
  const dailyCounts = useMemo(() => {
    return weekDays.map(day => ({
      day,
      count: getEventsForDay(events, day).length
    }));
  }, [weekDays, events]);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (scrollContainerRef.current && currentHour >= 5 && currentHour <= 23) {
      const hourIndex = currentHour - 5;
      const targetScroll = hourIndex * 60; // 60px per hour slot
      scrollContainerRef.current.scrollTop = targetScroll - 100; // offset for visibility
    }
  }, [currentHour]);

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-auto">
      <div className="min-w-[800px]">
        {/* Header with days and counts */}
        <div className="flex border-b sticky top-0 bg-card z-10">
          <div className="w-20 flex-shrink-0 border-r" />
          {dailyCounts.map(({ day, count }) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className="flex-1 text-center py-3 border-r last:border-r-0"
              >
                <div className="text-xs text-muted-foreground uppercase">
                  {format(day, "EEE", { locale: it })}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-primary' : ''}`}>
                  {format(day, "d")}
                </div>
                {count > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {count} {count === 1 ? 'evento' : 'eventi'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        {hours.map((hour) => {
          const showCurrentTimeLine = weekDays.some(day => 
            isSameDay(day, new Date()) && currentHour === hour
          );
          
          return (
            <div key={hour} className="flex border-b relative">
              <div className="w-20 flex-shrink-0 text-right pr-4 py-2 text-sm text-muted-foreground border-r">
                {format(new Date().setHours(hour, 0), "HH:mm")}
              </div>
              {weekDays.map((day) => {
                const slotEvents = getEventsForTimeSlot(events, day, hour);
                const isDayToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="flex-1 min-h-[60px] p-1 border-r last:border-r-0 relative"
                  >
                    <div className="flex gap-1">
                      {slotEvents.map((event) => (
                        <div key={event.id} className="flex-1 min-w-0">
                          <EventCard
                            event={event}
                            onClick={() => onEventClick(event)}
                            compact
                          />
                        </div>
                      ))}
                    </div>
                    {showCurrentTimeLine && isDayToday && (
                      <div 
                        className="absolute left-0 right-0 h-0.5 bg-destructive z-10 pointer-events-none"
                        style={{ top: `${(currentMinutes / 60) * 100}%` }}
                      >
                        <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-destructive" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
