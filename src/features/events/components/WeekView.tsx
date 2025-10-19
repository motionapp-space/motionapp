import { useMemo } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { getWeekDays, getEventsForTimeSlot } from "../utils/calendar-utils";
import { EventCard } from "./EventCard";
import type { EventWithClient } from "../types";

interface WeekViewProps {
  date: Date;
  events: EventWithClient[];
  onEventClick: (event: EventWithClient) => void;
}

export function WeekView({ date, events, onEventClick }: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(date), [date]);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[800px]">
        {/* Header with days */}
        <div className="flex border-b sticky top-0 bg-card z-10">
          <div className="w-20 flex-shrink-0 border-r" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 text-center py-3 border-r last:border-r-0"
            >
              <div className="text-xs text-muted-foreground uppercase">
                {format(day, "EEE", { locale: it })}
              </div>
              <div className="text-lg font-semibold">{format(day, "d")}</div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        {hours.map((hour) => (
          <div key={hour} className="flex border-b">
            <div className="w-20 flex-shrink-0 text-right pr-4 py-2 text-sm text-muted-foreground border-r">
              {format(new Date().setHours(hour, 0), "HH:mm")}
            </div>
            {weekDays.map((day) => {
              const slotEvents = getEventsForTimeSlot(events, day, hour);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="flex-1 min-h-[60px] p-1 border-r last:border-r-0"
                >
                  <div className="space-y-1">
                    {slotEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick(event)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
