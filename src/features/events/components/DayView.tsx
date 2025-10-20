import { useMemo } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { layoutOverlaps } from "../utils/layout";
import { minutesFromDayStart, toMinutes, MINUTE_HEIGHT, DAY_START_H, DAY_END_H, minutesVisible } from "../utils/time";
import { EventCard } from "./EventCard";
import type { EventWithClient } from "../types";

interface DayViewProps {
  date: Date;
  events: EventWithClient[];
  onEventClick: (event: EventWithClient) => void;
}

export function DayView({ date, events, onEventClick }: DayViewProps) {
  const hours = useMemo(() => Array.from({ length: DAY_END_H - DAY_START_H + 1 }, (_, i) => i + DAY_START_H), []);
  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();
  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  // Position events with overlap layout
  const positioned = useMemo(() => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayEvents = events.filter((e) => {
      const eventStart = new Date(e.start_at);
      const eventEnd = new Date(e.end_at);
      return eventStart < dayEnd && eventEnd > dayStart;
    });
    
    return layoutOverlaps(
      dayEvents.map((e) => ({
        id: e.id,
        start_at: e.start_at,
        end_at: e.end_at,
        client_id: e.client_id,
      }))
    );
  }, [events, date]);

  const gridHeight = minutesVisible() * MINUTE_HEIGHT;

  return (
    <div className="flex h-full overflow-auto">
      <div className="min-w-[600px] flex">
        {/* Hour labels */}
        <div className="w-20 flex-shrink-0 border-r border-border/50 text-xs text-muted-foreground">
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((hour, i) => (
              <div 
                key={hour} 
                className="absolute w-full flex items-center justify-end pr-3" 
                style={{ top: i * 60 * MINUTE_HEIGHT }}
              >
                {format(new Date().setHours(hour, 0), "HH:mm")}
              </div>
            ))}
          </div>
        </div>

        {/* Event grid */}
        <div className="flex-1 relative" style={{ height: gridHeight }}>
          {/* Hour lines */}
          {hours.map((_, i) => (
            <div 
              key={i} 
              className="absolute left-0 right-0 border-t border-border/40" 
              style={{ top: i * 60 * MINUTE_HEIGHT }} 
            />
          ))}

          {/* Current time line */}
          {isToday && currentHour >= DAY_START_H && currentHour <= DAY_END_H && (
            <div 
              className="absolute left-0 right-0 h-0.5 bg-destructive z-10 pointer-events-none"
              style={{ top: minutesFromDayStart(new Date()) * MINUTE_HEIGHT }}
            >
              <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-destructive" />
            </div>
          )}

          {/* Events with positioning */}
          {positioned.map((p) => {
            const ev = events.find((e) => e.id === p.id)!;
            if (!ev) return null;
            
            const start = new Date(ev.start_at);
            const end = new Date(ev.end_at);
            
            const dayStart = new Date(date);
            dayStart.setHours(DAY_START_H, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(DAY_END_H, 0, 0, 0);
            
            const startClamped = start < dayStart ? dayStart : start;
            const endClamped = end > dayEnd ? dayEnd : end;

            const top = minutesFromDayStart(startClamped) * MINUTE_HEIGHT;
            const height = (toMinutes(endClamped) - toMinutes(startClamped)) * MINUTE_HEIGHT;
            const widthPercent = 1 / p.columns;
            const leftPercent = p.column * widthPercent;

            return (
              <EventCard
                key={p.id}
                event={ev}
                onClick={() => onEventClick(ev)}
                positioning={{ top, height, leftPercent, widthPercent }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
